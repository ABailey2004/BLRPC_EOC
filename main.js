const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const database = require('./database');

// Disable GPU hardware acceleration to prevent GPU errors
app.disableHardwareAcceleration();

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    frame: false,
    title: 'Control Room - CAD System'
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Send status updates to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('app-version', app.getVersion());
  });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info.version);
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('error', (err) => {
  console.log('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info.version);
  }
});

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after app is ready
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

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

// IPC handler to manually check for updates
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// IPC handler to install update now
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Database IPC handlers
ipcMain.handle('db-connect', async (event, connectionString) => {
  return await database.connect(connectionString);
});

ipcMain.handle('db-disconnect', async () => {
  return await database.disconnect();
});

ipcMain.handle('db-is-connected', () => {
  return database.isConnected();
});

// CAD operations
ipcMain.handle('db-save-cad', async (event, cad) => {
  return await database.saveCad(cad);
});

ipcMain.handle('db-get-cads', async () => {
  return await database.getCads();
});

ipcMain.handle('db-delete-cad', async (event, reference) => {
  return await database.deleteCad(reference);
});

// Unit operations
ipcMain.handle('db-save-unit', async (event, unit) => {
  return await database.saveUnit(unit);
});

ipcMain.handle('db-get-units', async () => {
  return await database.getUnits();
});

ipcMain.handle('db-delete-unit', async (event, callsign) => {
  return await database.deleteUnit(callsign);
});

// Operator operations
ipcMain.handle('db-save-operator', async (event, operator) => {
  return await database.saveOperator(operator);
});

ipcMain.handle('db-get-operators', async () => {
  return await database.getOperators();
});

ipcMain.handle('db-remove-operator', async (event, name) => {
  return await database.removeOperator(name);
});

// Watch for real-time changes
let cadWatcher = null;
let unitWatcher = null;

ipcMain.on('db-watch-cads', () => {
  if (cadWatcher) return;
  cadWatcher = database.watchCads((change) => {
    if (mainWindow) {
      mainWindow.webContents.send('db-cads-changed', change);
    }
  });
});

ipcMain.on('db-watch-units', () => {
  if (unitWatcher) return;
  unitWatcher = database.watchUnits((change) => {
    if (mainWindow) {
      mainWindow.webContents.send('db-units-changed', change);
    }
  });
});
