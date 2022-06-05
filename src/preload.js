const {ipcRenderer, contextBridge} = require('electron');

contextBridge.exposeInMainWorld(
    "electron", {
        invoke: async (channel, ...args) => {
            let ret = await ipcRenderer.invoke(channel, ...args);
            console.log(channel,args, ret);
            return ret;
        }
    }
);