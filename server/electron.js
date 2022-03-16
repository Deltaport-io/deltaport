const { app, BrowserWindow, shell } = require('electron')
const path = require("path")

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: 'hidden'
  })
  mainWindow.loadURL(process.env.ELECTRON_START_URL ? process.env.ELECTRON_START_URL : `file://${path.join(__dirname, '../client/build/index.html')}`);  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app
  .whenReady()
  .then(() => {
    createWindow()
    app.on('activate', () => {
      if (mainWindow === null) createWindow()
    })
    app.server = require('./dist/index.js')
  })
  .catch(console.log)
