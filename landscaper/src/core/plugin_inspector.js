import * as zip from '@zip.js/zip.js';
import {Modal, Button} from 'antd';
import {UPSTREAM_URL, PLUGINS_DEPOT, GITHUB_API} from '../config';
import i18n from "i18next";
import {QuestionCircleOutlined} from '@ant-design/icons';

const {confirm, info} = Modal;
const neu = window.Neutralino;
const fs = neu.filesystem;
const FETCH_URL = UPSTREAM_URL + PLUGINS_DEPOT;
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    // eslint-disable-next-line
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

async function selectRelease(releases) {
    let selected = null;

    let modal = confirm({
      title: i18n.t('The following files available on github, which one would you like?'),
      icon: <QuestionCircleOutlined />,
      content: <div style={{ display: 'flex', flexDirection: 'column', gap: "10px 10px"}}> 
                {releases.map((e, idx)=> <Button onClick={()=>selected=idx}>{e.name}</Button>)}
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
    uuid = "";
    configFilename = 'mojoconfig.json';
    metaData = null;
    jarPath = "loading"
    onrefresh = ()=>{};
    github_releases = null;

    async parseJar(path){
        let data = await fs.readBinaryFile(path);
        data = new Uint8Array(data);
        let zip_entries = await new zip.ZipReader(new zip.Uint8ArrayReader(data), {useWebWorkers: true}).getEntries();
        for(let i = 0; i < zip_entries.length; i++){
            let entry = zip_entries[i];
            if (entry.filename === "plugin.json"){
                let config = await entry.getData(new zip.TextWriter());
                this.config = JSON.parse(config);
                this.fetch_upstream();
                break;
            }
        }
    }
    constructor(path, onrefresh, enabled = true) {
        if (path){
            this.jarPath = path;
            this.parseJar(path);
            this.folderPath = path.replace(/[^/]+$/,"");
        }
        this.uuid = uuidv4();
        if (onrefresh) this.onrefresh = onrefresh;
        this.enabled = enabled;
    }

    async fetch_upstream() {
        // if (!this.enabled) return;
        try{
            let response = await fetch(FETCH_URL + this.config.name + '.json');
            let metaData = await response.json();
            this.metaData = metaData;
            console.log(metaData);

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
    
    getID() {return this.uuid;}

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
        this.configContent = JSON.parse(await fs.readFile(this.folderPath + this.configFilename));
        return this.configContent;
    }

    async saveConfig(config) {
        if (!this.isConfigable()) return;
        this.configContent = config;
        await fs.writeFile(this.folderPath + this.configFilename, JSON.stringify(config))
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
        if (this.hasUpdate()){
            let index = await selectRelease(this.github_releases.assets);
            if (index === -1) return -1;
            let modal = info({
                title: i18n.t('Downloading') + "...",
                okButtonProps: {style: {display: 'none'}},
                closable: false
            });
            let tmpfilename = `./tmp-${uuidv4()}`;
            try{
                // let res = await fetch(this.github_releases.assets[index].browser_download_url, {redirect: "follow", mode:'no-cors'});
                // let data = new Uint8Array(await (await res.blob()).arrayBuffer());
                let command = `curl -L "${this.github_releases.assets[index].browser_download_url}" -o ${tmpfilename}`;
                // console.log(command);
                let data = await neu.os.execCommand(command, {background: false, stdIn:""})
                // eslint-disable-next-line
                if (data.exitCode !== 0) throw data;
                if (this.github_releases.assets[index].name.endsWith('.jar')){
                    neu.filesystem.removeFile(this.jarPath).catch();
                    await neu.filesystem.moveFile(tmpfilename, this.jarPath);
                } else if (this.github_releases.assets[index].name.endsWith('.zip')){
                    let data = await neu.filesystem.readBinaryFile(tmpfilename);
                    data = new Uint8Array(data);
                    let zip_entries = await new zip.ZipReader(new zip.Uint8ArrayReader(data), {useWebWorkers: true}).getEntries();
                    for(let i = 0; i < zip_entries.length; i++){
                        let entry = zip_entries[i];
                        if (entry.directory){
                            await neu.filesystem.createDirectory(entry.filename).catch();
                        } else {
                            let file = await entry.getData(new zip.Uint8ArrayWriter());
                            if (entry.filename.endsWith(".jar")){
                                neu.filesystem.writeBinaryFile(this.jarPath, file);
                            } else {
                                neu.filesystem.writeBinaryFile(this.folderPath + `/${entry.filename}`, file);
                            }
                        }
                    }
                    neu.filesystem.removeFile(tmpfilename);
                }
                // console.log(data);
                // await fs.writeBinaryFile(this.config.path, data);
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
                neu.filesystem.removeFile(tmpfilename).catch();
                modal = info({
                    title: i18n.t('Failed') + e
                });
            }
           
        }
        this.onrefresh();
    }
    
    async doDisable(){
        if (!this.enabled) return;
        await fs.moveFile(this.jarPath, this.jarPath + '.landscaper')
        this.jarPath += '.landscaper';
        this.enabled = false;
        this.onrefresh();
    }

    async doEnable(){
        if (this.enabled) return;
        let newJarPath = this.jarPath.replace('.landscaper','');
        await fs.moveFile(this.jarPath, newJarPath)
        this.jarPath = newJarPath;
        this.enabled = true;
        this.onrefresh();
    }
}