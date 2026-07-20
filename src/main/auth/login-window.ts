import { BrowserWindow, session, shell, type Event } from 'electron';
import { hasRealEspnSession } from './espn-session';

export const ESPN_PARTITION = 'persist:espn';
export const LOGIN_TIMEOUT_MS = process.env.ESPN_LOGIN_TIMEOUT_MS ? Number(process.env.ESPN_LOGIN_TIMEOUT_MS) : 5 * 60_000;
const LOGIN_URL = 'https://www.espn.com/login';
const ESPN_HOST = /(^|\.)espn\.com$/i;
let loginWindow: BrowserWindow | null = null;

export type LoginResult = 'authenticated' | 'cancelled' | 'timeout';

function isAllowed(urlString: string): boolean {
  try { const url = new URL(urlString); return url.protocol === 'https:' && ESPN_HOST.test(url.hostname); } catch { return false; }
}

export function getLoginWindow(): BrowserWindow | null { return loginWindow; }

export async function openEspnLogin(parent: BrowserWindow): Promise<LoginResult> {
  if (loginWindow && !loginWindow.isDestroyed()) { loginWindow.focus(); return 'cancelled'; }
  const espnSession = session.fromPartition(ESPN_PARTITION);
  return new Promise((resolve) => {
    let settled = false;
    let authenticated = false;
    const finish = (result: LoginResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      espnSession.cookies.removeListener('changed', onCookieChanged);
      if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
      loginWindow = null;
      resolve(result);
    };
    const onCookieChanged = async () => {
      if (await hasRealEspnSession(espnSession)) { authenticated = true; finish('authenticated'); }
    };
    loginWindow = new BrowserWindow({
      parent, modal: false, width: 1080, height: 760, minWidth: 720, minHeight: 560,
      title: 'ESPN Login', show: false,
      webPreferences: { partition: ESPN_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
    });
    loginWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (isAllowed(url)) return { action: 'allow', overrideBrowserWindowOptions: { parent: loginWindow ?? undefined, webPreferences: { partition: ESPN_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } } };
      void shell.openExternal(url); return { action: 'deny' };
    });
    loginWindow.webContents.on('will-navigate', (event: Event, url: string) => { if (!isAllowed(url)) event.preventDefault(); });
    loginWindow.once('ready-to-show', () => loginWindow?.show());
    loginWindow.once('closed', () => { loginWindow = null; if (!authenticated) finish('cancelled'); });
    espnSession.cookies.on('changed', onCookieChanged);
    const timer = setTimeout(() => finish('timeout'), LOGIN_TIMEOUT_MS);
    void loginWindow.loadURL(LOGIN_URL).catch(() => finish('cancelled'));
  });
}

export function cancelEspnLogin(): void {
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
}

