import { ipcMain } from 'electron';
import { z } from 'zod';
import { endEspnDiscovery } from '../auth/login-window';
import { discoveryAnalysis, discoverySnapshot, exportSanitizedDiscovery } from '../espn/discovery-runtime';
import { diagnosticsEnabled } from '../espn/espn-discovery';

const EmptyRequest = z.object({}).strict();
const channels = ['discovery:enabled', 'discovery:snapshot', 'discovery:analysis', 'discovery:export', 'discovery:end'] as const;
export function registerDiscoveryIpc(): void {
  ipcMain.handle('discovery:enabled', (_event, input) => { EmptyRequest.parse(input); return diagnosticsEnabled(); });
  ipcMain.handle('discovery:snapshot', (_event, input) => { EmptyRequest.parse(input); return discoverySnapshot(); });
  ipcMain.handle('discovery:analysis', (_event, input) => { EmptyRequest.parse(input); return discoveryAnalysis(); });
  ipcMain.handle('discovery:export', (_event, input) => { EmptyRequest.parse(input); return exportSanitizedDiscovery(); });
  ipcMain.handle('discovery:end', (_event, input) => { EmptyRequest.parse(input); return endEspnDiscovery(); });
}
export function unregisterDiscoveryIpc(): void { channels.forEach((channel) => ipcMain.removeHandler(channel)); }

