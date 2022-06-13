const path = require('path');
const path_escaped = path;

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const isDev = require('electron-is-dev');
const Store = require('electron-store');
const { electron } = require('process');
const fs = require('fs');
const electronStore = new Store();
const unzipper = require('unzipper');
const {download} = require('electron-dl');
const open = require('open');
const { MongoClient } = require("mongodb");
const PACKAGE = require('./package.json');

let mainWindow, mongoclient = {};

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: "allow-scripts",
      preload: path.join(__dirname, "src/preload.js") 
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  // win.loadURL(`file://${path.join(__dirname,"page/index.html")}`,
  isDev ? 
    win.loadURL('http://localhost:3000') :
    win.loadFile('./landscaper/build/index.html');
    ;
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
  mainWindow = win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("showOpenDialog", (_, title, props)=> {return dialog.showOpenDialog(mainWindow, {title: title, ...props});})

ipcMain.handle("get-data", (_, key, defaultValue)=>{return electronStore.get(key, defaultValue)})
ipcMain.handle("set-data", (_, key, value)=>{return electronStore.set(key, value)})
ipcMain.handle("read-file", (_, path)=>{
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  })
})
ipcMain.handle("get-stats", (_, path)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject)=>{
    fs.stat(path, (err, stats)=> {
      if (err) reject(err);
      stats.isFile = stats.isFile();
      stats.isDirectory = stats.isDirectory();
      resolve(stats);
    })
  })
})

ipcMain.handle("open", (_, url)=> {open(url)})
ipcMain.handle("list-dir", (_, path_)=>{
  if (!path_escaped.isAbsolute(path_)) path_ = path_escaped.join(app.getPath("temp"), path_);
  return new Promise((resolve, reject) => {
      fs.readdir(path_, (err, files)=>{
        resolve(files.map((entry)=>{
          return { 
            type: fs.statSync(path.join(path_, entry)).isFile() ? "FILE" : "DIRECTORY",
            entry
          }
        }))
      })
  })

})
ipcMain.handle("extract-file", (_, path, target, output)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise(async (resolve, reject) => {
    const zip = fs.createReadStream(path).pipe(unzipper.Parse({forceStream: true}));
    let ret = [];
    for await (const entry of zip) {
      const fileName = entry.path;
      const type = entry.type; // 'Directory' or 'File'
      // const size = entry.vars.uncompressedSize; // There is also compressedSize;
      if (!fileName.match(target)) { entry.autodrain(); continue;}
      if (type === 'File') {
        if (output) {
          entry.pipe(fs.createWriteStream(`${output}/${fileName}`));
        }
        ret.push({
          filename: fileName,
          data: await entry.buffer()
        })
      }
    }
    resolve(ret)
  })
})

ipcMain.handle("download-file", async (_, url, path_)=> {
  let options;
  if (!path_escaped.isAbsolute(path_)) {
    options = {
      directory: app.getPath("temp"), filename: path_
    }
  } else {
    options = {
      directory: path_escaped.dirname(path_),
      filename: path_escaped.basename(path_)
    }
    
  }
  await download(mainWindow, url, options);
  return;
})

ipcMain.handle('append-binary-file', (_, path, data)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject)=>{
    fs.appendFile(path, data, (err)=> {
      if (err) reject(err);
      resolve();
    })
  })
})

ipcMain.handle('write-file', (_, path, data)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject)=> {
    fs.createWriteStream(path, {encoding: 'utf8'}).write(data, (err)=>{
      if (err) reject(err);
      resolve();
    });
  })
})

ipcMain.handle('remove-file', (_, path)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject)=>{
    fs.unlink(path, (err)=>{
      if (err) reject(err);
      resolve();
    })
  })
})

ipcMain.handle('move-file', (_, originalPath, newPath)=> {
  if (!path_escaped.isAbsolute(originalPath)) originalPath = path_escaped.join(app.getPath("temp"), originalPath);
  if (!path_escaped.isAbsolute(newPath)) newPath = path_escaped.join(app.getPath("temp"), newPath);
  return new Promise((resolve, reject)=> {
    fs.rename(originalPath, newPath, (err)=> {
      if (err) reject(err);
      resolve();
    })
  })
})

ipcMain.handle('create-directory', (_, path)=> {
  if (!path_escaped.isAbsolute(path)) path = path_escaped.join(app.getPath("temp"), path);
  return new Promise((resolve, reject)=> {
    fs.mkdir(path, {recursive: true}, (err)=> {
      if (err) reject(err);
      resolve();
    })
  })
})

const getDatabase = async (url, db) => {
  if (!mongoclient[url]) mongoclient[url] = new MongoClient(url);
  const client = mongoclient[url];
  await client.connect();
  return client.db(db);
}

ipcMain.handle('mongo-find', async (_, url, db, collection, query, pagenation, options) => {
  const database = await getDatabase(url,db);
  const coll = database.collection(collection);
  // console.log(coll)
  let find = coll.find(query, options);
  if (pagenation) {
    const {per_page, page_no} = pagenation;
    find = find.skip(page_no * per_page).limit(per_page);
  }
  return await find.toArray();
})

ipcMain.handle('mongo-count', async (_, url, db, collection, query) => {
  const database = await getDatabase(url,db);
  const coll = database.collection(collection);
  return await coll.countDocuments(query);
})

ipcMain.handle('mongo-aggregate', async (_, url, db, collection, aggregate)=>{
  const database = await getDatabase(url,db);
  const coll = database.collection(collection);
  return await coll.aggregate(aggregate).toArray();
})

ipcMain.handle('mongo-distinct', async (_, url, db, collection, column) => {
  const database = await getDatabase(url,db);
  const coll = database.collection(collection);
  return await coll.distinct(column);
})

ipcMain.handle('mongo-seturi', (_, replace, uri)=> {
  mongoclient[replace] = new MongoClient(uri);
})

ipcMain.handle('get-version', ()=> {return PACKAGE.version})