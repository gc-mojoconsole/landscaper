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
        // return await this.neu.filesystem.readFile(path);
        return await this.channel.invoke('read-file', path);
    }

    async readBinaryFile(path){
        // return await this.neu.filesystem.readBinaryFile(path);
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
        // return await this.neu.filesystem.writeFile(path, data);
        return await this.channel.invoke('write-file', path, data);
    }

    async getData(key, defaultValue=null) {
        // let ret = await this.neu.storage.getData(key);
        // if (ret === null || ret === undefined) {
        //     return defaultValue;
        // } else {
        //     return ret;
        // }
        return await this.channel.invoke('get-data',key, defaultValue);
    }

    async setData(key, value) {
        return await this.channel.invoke('set-data',key, value);
        // await this.neu.storage.setData(key, value);
    }

    async listDir(path) {
        // return await this.neu.filesystem.readDirectory(path);
        return await this.channel.invoke('list-dir',path);
    }

    async removeFile(path) {
        // try {
        //     await this.neu.filesystem.removeFile(path);
        // } catch(e) {
        //     console.log(e);
        // }
        return await this.channel.invoke('remove-file',path);
    }

    async createDirectory(path) {
        // try{
        //     return await this.neu.filesystem.createDirectory(path);
        // } catch(e) {
        //     console.log(e);
        // }
        return await this.channel.invoke('create-directory', path);
    }

    async moveFile(originalPath, newPath) {
        // return await this.neu.filesystem.moveFile(originalPath, newPath);
        return await this.channel.invoke('move-file', originalPath, newPath);
    }

    open(url) {
        // this.neu.os.open(url);
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
}