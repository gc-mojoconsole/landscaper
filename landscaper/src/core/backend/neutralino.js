import * as zip from "@zip.js/zip.js";

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    // eslint-disable-next-line
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default class Neutralino{
    neu = null
    constructor(obj){
        if (!obj) throw new Error("must provide a neutralino object");
        this.neu = obj;
    }

    async readFile(path){
        return await this.neu.filesystem.readFile(path);
    }

    async readBinaryFile(path){
        return await this.neu.filesystem.readBinaryFile(path);
    }

    async downloadFile(url){
        let tmpFilename = uuidv4() + '.tmp';
        // eslint-disable-next-line
        let response = await this.neu.os.execCommand(`curl -L "${url.replaceAll(/"/g, '\\\"')}" -o ${tmpFilename}`)
        if (response.exitCode === 0) {
            return tmpFilename;
        } else {
            throw new Error('Download failed');
        }
    }

    async downloadAndExtractFile(filename, target) {

    }

    async extractFile(path, target = /.*/, output = null) {
        if (typeof target === 'string') {
            target = `^${target}$`
        }
        let data = await this.readBinaryFile(path);
        data = new Uint8Array(data);
        let zip_entries = await new zip.ZipReader(new zip.Uint8ArrayReader(data), {useWebWorkers: true}).getEntries();
        let ret = []
        if (output) this.createDirectory(output);
        for(let i = 0; i < zip_entries.length; i++){
            let entry = zip_entries[i];
            if (entry.filename.match(target)){
                let data = await entry.getData(new zip.Uint8ArrayWriter());
                if (output === null) {
                    ret.push({
                        filename: entry.filename, 
                        data,
                        directory: entry.directory});
                } else {
                    if (entry.directory){
                        await this.createDirectory(`${output}/${entry.filename}`);
                    } else {
                        await this.writeBinaryFile(`${output}/${entry.filename}`, data);
                        ret.push({
                            filename: `${output}/${entry.filename}`,
                            data: null,
                            directory: null
                        });
                    }
                }

            }
        }
        return ret;
    }

    async writeBinaryFile(path, data, cb_process) {
        const CHUNK_SIZE = 1_000_000;
        for (var current = 0; current < data.length; current+=CHUNK_SIZE){
            let end = current + CHUNK_SIZE > data.length ? data.length: current + CHUNK_SIZE;
            await this.neu.filesystem.appendBinaryFile(path, data.slice(current, end));
            if (cb_process){ cb_process(Math.ceil(current / data.length * 100)); }
        }
    }

    async writeFile(path, data) {
        return await this.neu.filesystem.writeFile(path, data);
    }

    async getData(key, defaultValue=null) {
        let ret = await this.neu.storage.getData(key);
        if (ret === null || ret === undefined) {
            return defaultValue;
        } else {
            return ret;
        }
    }

    async setData(key, value) {
        await this.neu.storage.setData(key, value);
    }

    async listDir(path) {
        return await this.neu.filesystem.readDirectory(path);
    }

    async removeFile(path) {
        try {
            await this.neu.filesystem.removeFile(path);
        } catch(e) {
            console.log(e);
        }
    }

    async createDirectory(path) {
        try{
            return await this.neu.filesystem.createDirectory(path);
        } catch(e) {
            console.log(e);
        }
    }

    async moveFile(originalPath, newPath) {
        return await this.neu.filesystem.moveFile(originalPath, newPath);
    }

    open(url) {
        this.neu.os.open(url);
    }

    async showOpenDialog(title, props){
        return await this.neu.os.showOpenDialog(title, props);
    }

    async getStats(path){
        return await this.neu.filesystem.getStats(path);
    }
}