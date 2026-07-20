import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { registerAuthIpc, unregisterAuthIpc } from './ipc/auth-ipc';

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 980, height: 680, minWidth: 720, minHeight: 520, show: false, title: 'ESPN Fantasy AI',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
  });
  window.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://')) void shell.openExternal(url); return { action: 'deny' }; });
  window.webContents.on('will-navigate', (event, url) => { const current = window.webContents.getURL(); if (current && url !== current) event.preventDefault(); });
  window.once('ready-to-show', () => window.show());
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void window.loadURL(devUrl); else void window.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  return window;
}

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  registerAuthIpc(mainWindow);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { mainWindow = createMainWindow(); registerAuthIpc(mainWindow); } });
});
app.on('window-all-closed', () => { unregisterAuthIpc(); if (process.platform !== 'darwin') app.quit(); });

