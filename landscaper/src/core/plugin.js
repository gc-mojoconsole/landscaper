import PluginInsepctor from './plugin_inspector';

const neu = window.Neutralino;
const fs = neu.filesystem;
export default class PluginManager{
    installed = [];
    path = '';

    constructor(path, onrefresh){
        if (path){
            this.path = path.replace(/[^/]+$/,'');
            this.getPluginFolder(this.path).then(
                (plugin_folder) => {
                    fs.readDirectory(plugin_folder).then((file_list) => {
                        file_list.forEach(({entry, type}) => {
                            if (type === 'FILE' && entry.endsWith('.jar')) {
                                this.installed.push(new PluginInsepctor(plugin_folder+'/'+entry, onrefresh, true));
                            } else if (type === 'FILE' && entry.endsWith('.jar.landscaper')) {
                                this.installed.push(new PluginInsepctor(plugin_folder+'/'+entry, onrefresh, false));
                            }
                        })
                    })
                }
            );
        }
    }

    async getPluginFolder(path){
        let config = JSON.parse(await fs.readFile(path + '/config.json'));
        return path + '/' + config.folderStructure.plugins;
    }
}