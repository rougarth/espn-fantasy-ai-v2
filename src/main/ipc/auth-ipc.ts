import { BrowserWindow, ipcMain, session } from 'electron';
import { z } from 'zod';
import { clearEspnSession, hasRealEspnSession } from '../auth/espn-session';
import { cancelEspnLogin, ESPN_PARTITION, openEspnLogin } from '../auth/login-window';

const EmptyRequest = z.object({}).strict();
const channels = ['auth:status', 'auth:login', 'auth:cancel', 'auth:logout', 'auth:clear'] as const;

export function registerAuthIpc(mainWindow: BrowserWindow): void {
  const espnSession = session.fromPartition(ESPN_PARTITION);
  ipcMain.handle('auth:status', (_event, input) => { EmptyRequest.parse(input); return hasRealEspnSession(espnSession); });
  ipcMain.handle('auth:login', async (_event, input) => { EmptyRequest.parse(input); return openEspnLogin(mainWindow); });
  ipcMain.handle('auth:cancel', (_event, input) => { EmptyRequest.parse(input); cancelEspnLogin(); });
  const clear = async (_event: Electron.IpcMainInvokeEvent, input: unknown) => { EmptyRequest.parse(input); cancelEspnLogin(); await clearEspnSession(espnSession); return true; };
  ipcMain.handle('auth:logout', clear);
  ipcMain.handle('auth:clear', clear);
}

export function unregisterAuthIpc(): void { channels.forEach((channel) => ipcMain.removeHandler(channel)); }

