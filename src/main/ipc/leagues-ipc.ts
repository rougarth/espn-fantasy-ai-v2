import { ipcMain, session } from 'electron';
import { z } from 'zod';
import { ESPN_PARTITION } from '../espn/espn-session';
import { listUserLeagues } from '../espn/list-user-leagues';

const EmptyRequest = z.object({}).strict();
export function registerLeaguesIpc(): void {
  ipcMain.handle('leagues:list', (_event, input) => { EmptyRequest.parse(input); return listUserLeagues(session.fromPartition(ESPN_PARTITION)); });
}
export function unregisterLeaguesIpc(): void { ipcMain.removeHandler('leagues:list'); }

