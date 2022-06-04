
export default class Updater{
    backend = null;
    progress_cb = ()=>{};
    download_url = "";
    target_path = ""
    constructor(backend, url, target_path, cb ){
        this.backend = backend;
        this.download_url = url;
        if (cb) this.progress_cb = cb;
        this.target_path = target_path;
    }

    async tryExecute(){
        try{
            await this.execute();
        } catch(e){
            this.progress_cb({error: e});
        }
    }

    async execute(){
        let tmpfilename = await this.backend.downloadFile(this.download_url);
        this.progress_cb({step: 1}); // download finished
        let file = (await this.backend.extractFile(tmpfilename))[0];
        const {data} = file;
        this.progress_cb({step: 2}); // extract finished

        await this.backend.writeBinaryFile(this.target_path, data, (percent)=> {this.progress_cb.bind(this)({percent})});
        

        this.progress_cb({step: 3}) // copy finished
        this.backend.removeFile(tmpfilename).catch();
    }
}