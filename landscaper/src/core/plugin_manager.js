// import * as zip from '@zip.js/zip.js';
import {Modal, Button} from 'antd';
import {UPSTREAM_URL, PLUGINS_DEPOT, GITHUB_API} from '../config';
import i18n from "i18next";
import {QuestionCircleOutlined} from '@ant-design/icons';

const {confirm, info} = Modal;
const FETCH_URL = UPSTREAM_URL + PLUGINS_DEPOT;
const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

async function selectRelease(releases) {
    let selected = null;

    let modal = confirm({
      title: i18n.t('The following files available on github, which one would you like?'),
      icon: <QuestionCircleOutlined />,
      content: <div style={{ display: 'flex', flexDirection: 'column', gap: "10px 10px"}}> 
                {releases.map((e, idx)=> <Button key={e.name} onClick={()=>selected=idx}>{e.name}</Button>)}
            </div>,
      okButtonProps: {style: {display:'none'}},
      closable: true,
      maskClosable: true,
      onCancel: ()=>{selected = -1}
    });
    while (selected === null) {
        await delay(200);
    }
    modal.destroy();
    return selected;
}

export default class PluginInsepctor{
    config = {
        name: "loading",
        version: "loading",
        authors: ["loading"],
    };
    configContent = null;
    configFilename = 'mojoconfig.json';
    metaData = null;
    jarPath = "loading"
    onrefresh = ()=>{};
    github_releases = null;
    backend = null;
    parent = null;

    async parseJar(path){
        let ret = await this.backend.extractFile(path, 'plugin.json');
        if (ret.length === 0) throw new Error(`${path} is not a valid plugin.`)
        const {data} = ret[0];
        this.config = JSON.parse(new TextDecoder().decode(data));
        this.fetch_upstream();
    }
    constructor(parent, path, backend, onrefresh, enabled = true) {
        this.backend = backend;
        this.parent = parent;
        if (path){
            this.jarPath = path;
            this.parseJar(path);
            this.folderPath = path.match(/(.*)[/\\]/)[1]||'';
        }
        if (onrefresh) this.onrefresh = onrefresh;
        this.enabled = enabled;
    }

    async fetch_upstream() {
        // if (!this.enabled) return;
        try{
            let response = await fetch(FETCH_URL + this.config.name + '.json');
            let metaData = await response.json();
            this.metaData = metaData;

            // fetch release from github
            if (metaData.releases){
                response = await fetch(`${GITHUB_API}/repos/${metaData.github}/${metaData.releases}`);
                this.github_releases = await response.json();
            }

        } catch(e){
            console.log(e);
        }
        this.onrefresh();
    }
    

    getName() { return this.config.name;}
    
    getVersion() {return this.config.version;}

    getAuthors() {return this.config.authors;}

    getSchema() {
        if (this.metaData) {
            return this.metaData.config_schema;
        }
        return null;
    }

    getTags() {
        if (this.metaData && this.metaData.tags) { return this.metaData.tags}
        return ["Not integrated"];
    }

    isConfigable() {
        if (this.metaData){
            if (this.metaData.config_path){
                this.configFilename = this.metaData.config_path;
                return true;
            }
        }
        return false;
    }

    async getConfigContent() {
        if (!this.isConfigable()){
            return;
        }
        this.configContent = JSON.parse(await this.backend.readFile(this.folderPath + this.configFilename));
        return this.configContent;
    }

    async saveConfig(config) {
        if (!this.isConfigable()) return;
        this.configContent = config;
        await this.backend.writeFile(this.folderPath + this.configFilename, JSON.stringify(config))
    }
    
    getGithub(){
        if (this.metaData && this.metaData.github){
            return "https://github.com/" + this.metaData.github;
        }
        return null;
    }

    hasUpdate(){
        if (this.github_releases)
            return !this.config.version.includes(this.github_releases.tag_name);
        return false;
    }

    getRemoteVersion(){
        if (this.github_releases) return this.github_releases.tag_name;
        return "N/A";
    }

    async fetchUpdate(){
        if (!this.backend) this.backend = window.landscaper.backend;
        if (this.hasUpdate()){
            let index = await selectRelease(this.github_releases.assets);
            if (index === -1) return -1;
            let modal = info({
                title: i18n.t('Downloading') + "...",
                okButtonProps: {style: {display: 'none'}},
                closable: false
            });
            let url = this.github_releases.assets[index].browser_download_url;
            let tmpfilename = '';
            try{
                tmpfilename = await this.backend.downloadFile(url);
                if (this.github_releases.assets[index].name.endsWith('.jar')){
                // if we downloaded a jar file from github
                await this.backend.removeFile(this.jarPath);
                    await this.backend.moveFile(tmpfilename, this.jarPath);
                } else if (this.github_releases.assets[index].name.endsWith('.zip')){
                // if we downloaded a zip file from github
                    const files = await this.backend.extractFile(tmpfilename, /.*/, this.folderPath);

                    files.forEach(({filename}) => {
                        if (filename.endsWith('.jar') && filename !== this.jarPath) {
                            this.backend.removeFile(this.jarPath).then(() => {
                                this.backend.moveFile(filename, this.jarPath);
                            });
                        }
                    })
                }
                
                this.backend.removeFile(tmpfilename);

                await this.parseJar(this.jarPath);
                modal.destroy();
                let acknowledged = false;
                modal = info({
                    title: i18n.t('Success') + "!",
                    onOk: ()=>{acknowledged = true},
                    onCancel: ()=>{acknowledged = true},
                })
                let counter = 50;
                while (acknowledged === false && counter > 0){
                    modal.okText = i18n.t('Success') + `(${Math.floor(counter/ 10)}s)`
                    await delay(100);
                    counter -= 1;
                }
                modal.destroy();
            } catch(e){
                console.log(e);
                modal.destroy();
                this.backend.removeFile(tmpfilename);
                modal = info({
                    title: i18n.t('Failed') + e
                });
            }
           
        }
        this.onrefresh();
    }
    
    async doDisable(){
        if (!this.enabled) return;
        await this.backend.moveFile(this.jarPath, this.jarPath + '.landscaper')
        this.jarPath += '.landscaper';
        this.enabled = false;
        this.onrefresh();
    }

    async doEnable(){
        if (this.enabled) return;
        let newJarPath = this.jarPath.replace('.landscaper','');
        await this.backend.moveFile(this.jarPath, newJarPath)
        this.jarPath = newJarPath;
        this.enabled = true;
        this.onrefresh();
    }
}