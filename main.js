const { app, BrowserWindow, ipcMain } = require('electron');
const iniciarServidor = require('./server');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 380,
        height: 700,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    ipcMain.removeAllListeners('fechar-app');
    ipcMain.on('fechar-app', () => {
        app.quit();
    });

    ipcMain.removeAllListeners('minimizar-app');
    ipcMain.on('minimizar-app', () => {
        mainWindow.minimize();
    });
}

app.whenReady().then(() => {
    iniciarServidor(3000);
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});