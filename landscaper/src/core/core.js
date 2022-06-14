import Watchable from './watchable';
import PluginManager from './plugin_manager';
import {GITHUB_API} from '../config';
import Updater from './updater';
import path_escaped from 'path-browserify';
// const delay = async (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

export default class Grasscutter extends Watchable{
    backend = null;
    installed = [];
    path = "loading";
    version = {tag: "n/a", hash: "n/a"}
    target_branch = 'development';
    commits = [];
    workflows = [];
    updater = Updater;
    ready = false;
    branches = [];
    config = {};

    constructor(backend){
        super();
        this.backend = backend;
        this.initilize();
    }

    async initilize(){
        await this.getPath();
        try{
            await this.loadConfig();
            this.scanPlugins();
            this.readVersion();
            this.fetchUpstream();
        } catch(e){
            console.log(e);
            this.path = null;
            this.onUpdate();
        }
    }

    async getPath(){
        try{
            if (this.path === "loading" || this.path === null || this.path === ''){
                this.path = await this.backend.getData("grasscutter_path");
            }
            this.onUpdate();
            return this.path;
        } catch(e){
            console.log(e);
            this.path = null;
            this.onUpdate();
            return null;
        }
    }

    async getFolder(){
        let path = await this.getPath();
        if (path){
            return path.match(/(.*)[/\\]/)[1]||'';
        } else {
            return null;
        }
    }

    async setPath(path){
        this.path = path;
        await this.backend.setData("grasscutter_path", path);
    }

    async getConfig(){
        let path = await this.getFolder();
        if (!path) throw new Error("config.json not found");
        return JSON.parse(await this.backend.readFile(path_escaped.join(path, "config.json")));
    }

    async loadConfig(){
        this.config = await this.getConfig();
        this.onUpdate();
    }

    async saveConfig(config){
        this.config = config;
        let path = await this.getFolder();
        await this.backend.writeFile(path_escaped.join(path, "config.json"), JSON.stringify(config));
        this.onUpdate();
    }

    async scanPlugins(){
        let folder = path_escaped.join(await this.getFolder(), this.config.folderStructure.plugins);
        this.installed = []
        let files = await this.backend.listDir(folder);
        files.forEach(({entry, type}) => {
            if (type === 'FILE' && entry.endsWith('.jar')){
                this.installed.push(new PluginManager(this, `${folder}/${entry}`, this.backend, this.onUpdate.bind(this), true));
                this.onUpdate();
            } else if (type === 'FILE' && entry.endsWith('.jar.landscaper')){
                this.installed.push(new PluginManager(this, `${folder}/${entry}`, this.backend, this.onUpdate.bind(this), false));
                this.onUpdate();
            }
        })
    }

    async readVersion(){
        const regex = /VERSION[\s\S]*ConstantValue[^0-9\-.a-zA-Z]*([0-9.\-a-zA-Z]+)[\s\S]*GIT_HASH[^0-9a-f]*([0-9a-f]+)[\s\S]*Code/;
        try{
            let buildconfig = (await this.backend.extractFile(this.path, 'emu/grasscutter/BuildConfig.class'))[0];
            const {data} = buildconfig;
            let content = new TextDecoder().decode(data);
            let ret = content.match(regex);
            this.version = {
                tag: ret[1],
                hash: ret[2]
            }
            this.ready = true;
        } catch (e){
            this.path = null;
            await this.backend.setData("grasscutter_path", null);
        }
        this.onUpdate();
    }

    async getBranch(){
        let ret = await this.backend.getData('head-branch')
        if (ret) this.target_branch = ret;
        return this.target_branch;
    }

    async setBranch(branch) {
        this.target_branch = branch;
        this.backend.setData('head-branch', branch);
        this.fetchUpstream();
    }

    async fetchUpstream(){
        fetch(`${GITHUB_API}/repos/grasscutters/grasscutter/commits?sha=${this.target_branch}`).then(
            async (res)=>{
                this.commits = await res.json();
            }
        ).then(this.onUpdate.bind(this))

        fetch(`${GITHUB_API}/repos/grasscutters/grasscutter/actions/workflows/build.yml/runs?event=push&branch=${this.target_branch}`).then(
            (res)=>{
                res.json().then(data=>{
                    if (data.total_count === 0) {
                        return;
                    }
                    this.workflows = data.workflow_runs;
                })
            }
        ).then(this.onUpdate.bind(this))

        fetch(`${GITHUB_API}/repos/Grasscutters/Grasscutter/branches`).then((data)=>{
            data.json().then((data) => {
                let branches = [];
                data.forEach((branch) => {
                    branches.push(branch.name)
                });
                this.branches = branches;
            })
        }).then(this.onUpdate.bind(this))
    }

    async fetchCustomWorkflows(event = 'push', branch = 'development', page= 1) {
        return new Promise((resolve, reject) => {
            fetch(`${GITHUB_API}/repos/grasscutters/grasscutter/actions/workflows/build.yml/runs?event=${event}&branch=${branch}&page=${page}`).then(
                (res)=>{
                    res.json().then(data=>{
                        resolve(data.workflow_runs);
                    })
                }
            ).catch(reject);
        })
    }

    async getArtifactUrl(workflow){
        let ret = await (await fetch(workflow.artifacts_url.replace(/https:\/\/api.github.com/, GITHUB_API))).json();
        if(ret.total_count === 0){
            return null;
        } else {
            return ret.artifacts[0].archive_download_url.replace(/https:\/\/api.github.com/, GITHUB_API);
        }
    }

    async dooUpdate() {
        let url = await this.getArtifactUrl(this.workflows[0]);
        this.updater = new Updater(this.backend, url, './gc.jar', (e)=> {console.log(e)});
    }

    async getRecordCount(collection, query={}, db="server") {
        if (!this.backend.getRecordCount) return;
        return await this.backend.getRecordCount(this.config.databaseInfo[db].connectionUri, this.config.databaseInfo[db].collection, collection, query);
    }

    async getRecord(collection, {query={}, db="server", pagenation=null, options={}}) {
        if (!this.backend.getRecordCount) return;
        return await this.backend.getRecord(this.config.databaseInfo[db].connectionUri, this.config.databaseInfo[db].collection, collection, query, pagenation, options);
    }

    async getDBAggregate(collection, aggregate, db="server") {
        if (!this.backend.getRecordCount) return;
        return await this.backend.getDBAggregate(this.config.databaseInfo[db].connectionUri, this.config.databaseInfo[db].collection, collection, aggregate);
    }

    async getDBDistinct(collection, key, db="server") {
        if (!this.backend.getRecordCount) return;
        return await this.backend.getDBDistinct(this.config.databaseInfo[db].connectionUri, this.config.databaseInfo[db].collection, collection, key);
    }
    
    async setDBUri(replace, uri) {
        if (!this.backend.getRecordCount) return;
        return await this.backend.setDBUri(replace, uri);
    }

    async checkDBconnection({uri= null, collection=null, db='server'} = {}) {
        if (uri === null) uri = this.config.databaseInfo[db].connectionUri
        if (collection === null) collection = this.config.databaseInfo[db].collection
        return await this.backend.checkDBconnection(uri, collection, 'players');
    }
}