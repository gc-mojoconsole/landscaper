function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    // eslint-disable-next-line
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default class ElectronBackend{
    constructor(obj){
        this.channel = obj;
    }

    async readFile(path){
        return await this.channel.invoke('read-file', path);
    }

    async readBinaryFile(path){
        return await this.channel.invoke('read-binary-file', path);
    }

    async downloadFile(url){
        let tmpFilename = uuidv4() + '.tmp';
        await this.channel.invoke('download-file', url, tmpFilename);
        return tmpFilename
    }

    async downloadAndExtractFile(filename, target) {

    }

    async extractFile(path, target = /.*/, output = null) {
        if (typeof target === 'string') {
            target = `^${target}$`
        }
        return await this.channel.invoke('extract-file', path, target, output)
    }

    async writeBinaryFile(path, data, cb_process) {
        this.removeFile(path);
        const CHUNK_SIZE = 10_000_000;
        for (var current = 0; current < data.length; current+=CHUNK_SIZE){
            let end = current + CHUNK_SIZE > data.length ? data.length: current + CHUNK_SIZE;
            await this.channel.invoke('append-binary-file', path, data.slice(current, end));
            if (cb_process){ cb_process(Math.ceil(current / data.length * 100)); }
        }
    }

    async writeFile(path, data) {
        return await this.channel.invoke('write-file', path, data);
    }

    async getData(key, defaultValue=null) {
        return await this.channel.invoke('get-data',key, defaultValue);
    }

    async setData(key, value) {
        return await this.channel.invoke('set-data',key, value);
    }

    async listDir(path) {
        return await this.channel.invoke('list-dir',path);
    }

    async removeFile(path) {
        try {
            return await this.channel.invoke('remove-file',path);
        } catch(e) {
            console.log(e);
        }
    }

    async createDirectory(path) {
        return await this.channel.invoke('create-directory', path);
    }

    async moveFile(originalPath, newPath) {
        return await this.channel.invoke('move-file', originalPath, newPath);
    }

    open(url) {
        this.channel.invoke('open', url);
    }

    async showOpenDialog(title, props){
        let ret = await this.channel.invoke('showOpenDialog', title, props);
        return ret.filePaths;
    }

    async getStats(path){
        let ret = await this.channel.invoke('get-stats', path);
        return ret;
    }

    async getRecordCount(uri, db, coll, query) {
        return await this.channel.invoke('mongo-count', uri, db, coll, query);
    }

    async getRecord(uri, db, coll, query, pagenation, options) {
        return await this.channel.invoke('mongo-find', uri, db, coll, query, pagenation, options);
    }

    async getDBAggregate(uri, db, coll, aggregate) {
        return await this.channel.invoke('mongo-aggregate', uri, db, coll, aggregate);
    }

    async getDBDistinct(uri, db, coll, key) {
        return await this.channel.invoke('mongo-distinct', uri, db, coll, key);
    }

    async setDBUri(replace, uri) {
        return await this.channel.invoke('mongo-seturi', replace, uri);
    }

    checkDBconnection(uri, db, coll) {
        return new Promise(async (resolve, reject) => {
            try {
                setTimeout(() => resolve(false), 1000);
                await this.channel.invoke('mongo-find', uri, db, coll, {never: ''})
                resolve(true);
            } catch (err) {
                resolve(false);
            }
        })
    }

    async getVersion(){
        return await this.channel.invoke('get-version');
    }

}