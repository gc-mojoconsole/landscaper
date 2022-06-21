import path from 'path-browserify';

const PLAYERS_AGGREGATE = [
    { "$group": { "_id":  null,uid: {$push: "$_id"},nickname: {$push: "$nickname"}}},
    { "$project":{uid:true,nickname:true}}
];

export default class Cache {
    cache = {}
    backend = null;

    constructor(backend) {
        this.backend = backend;
    }

    defaults_cb = {
        players: async (b) => (await b.getDBAggregate('players', PLAYERS_AGGREGATE))[0], 
        items: async (b)=> {
            try{
                let ret = {};
                let current = 'N/A';
                let handbook = await b.backend.readFile(path.join(await b.getFolder(), 'GM Handbook.txt'));
                handbook = handbook.split(/\r?\n/);
                for (let i in handbook) {
                    let line = handbook[i];
                    if (line.match(/^\s*$/)) continue;
                    let comment = line.match(/\/\/\s*(\S*)/);
                    if (comment){
                        current = comment[1];
                        ret[current] = {};
                        continue;
                    } else {
                        const [id, name] = line.split(/:/).map((v)=> v.trim())
                        ret[current][id] = name
                    }
                }
                return ret;
            } catch(e){
                throw new Error(path.join(await b.getFolder(), 'GM Handbook.txt') + "does not exsit or parse error, human friendly display not available.")
            }
            
        }
    }

    async get(key, {fetcher=undefined, bpass_cache=false}) {
        if (bpass_cache){
            this.cache[key] = undefined
        }
        if (this.cache[key]) return this.cache[key]
        if (!fetcher) {fetcher = this.defaults_cb[key]}
        if (!fetcher) throw new Error("Cache miss but fetcher undefined");
        this.cache[key] = await fetcher(this.backend);
        return this.cache[key];
    }
}