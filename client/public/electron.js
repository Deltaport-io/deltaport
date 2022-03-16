const { app, BrowserWindow, shell, nativeImage } = require('electron')
const path = require("path")
const icon = nativeImage.createFromPath(__dirname + 'android-chrome-512x512.png')

let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: 'hidden',
    icon: icon
  })
  mainWindow.loadURL(process.env.ELECTRON_START_URL ? process.env.ELECTRON_START_URL : `file://${path.join(__dirname, '../build/index.html')}`);
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
  })
  .catch(console.log)
