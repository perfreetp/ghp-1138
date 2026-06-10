import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    backgroundColor: '#0a1628',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '消防控制室值守台',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('print-disposal', async () => {
  const options = {
    printBackground: true,
    color: true,
    margins: {
      marginType: 'default' as const,
    },
  };

  return new Promise((resolve) => {
    mainWindow?.webContents.print(options, (success, errorType) => {
      resolve({ success, errorType });
    });
  });
});

ipcMain.handle('show-alert', async (_, message: string) => {
  dialog.showMessageBox(mainWindow!, {
    type: 'warning',
    title: '系统提醒',
    message: message,
    buttons: ['确认'],
  });
});
