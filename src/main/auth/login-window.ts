import { BrowserWindow, session, shell, type Event } from 'electron';
import { hasRealEspnSession } from './espn-session';
import { diagnosticsEnabled } from '../espn/espn-discovery';
import { startDiscoveryRuntime, stopDiscoveryRuntime } from '../espn/discovery-runtime';
import { isAllowedLoginUrl } from '../espn/login-domains';

export const ESPN_PARTITION = 'persist:espn';
export const LOGIN_TIMEOUT_MS = process.env.ESPN_LOGIN_TIMEOUT_MS ? Number(process.env.ESPN_LOGIN_TIMEOUT_MS) : 5 * 60_000;
const LOGIN_URL = 'https://www.espn.com/login';
const FANTASY_FOOTBALL_URL = 'https://fantasy.espn.com/football/';
let loginWindow: BrowserWindow | null = null;
let pendingLogin: Promise<LoginResult> | null = null;
let endDiscoveryCallback: (() => void) | null = null;

export type LoginResult = 'authenticated' | 'cancelled' | 'timeout';

export function getLoginWindow(): BrowserWindow | null { return loginWindow; }

export async function openEspnLogin(parent: BrowserWindow): Promise<LoginResult> {
  if (loginWindow && !loginWindow.isDestroyed() && pendingLogin) { loginWindow.focus(); return pendingLogin; }
  const espnSession = session.fromPartition(ESPN_PARTITION);
  pendingLogin = new Promise((resolve) => {
    let settled = false;
    let authenticated = false;
    let discoveryActive = false;
    let allowDiscoveryClose = false;
    const finish = (result: LoginResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      espnSession.cookies.removeListener('changed', onCookieChanged);
      stopDiscoveryRuntime(); endDiscoveryCallback = null;
      allowDiscoveryClose = true; if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
      loginWindow = null;
      pendingLogin = null;
      resolve(result);
    };
    const onCookieChanged = async () => {
      if (!await hasRealEspnSession(espnSession)) return;
      authenticated = true;
      if (diagnosticsEnabled()) {
        if (discoveryActive) return;
        discoveryActive = true; parent.webContents.send('discovery:started');
        void loginWindow?.loadURL(FANTASY_FOOTBALL_URL);
      } else finish('authenticated');
    };
    loginWindow = new BrowserWindow({
      parent, modal: false, width: 1080, height: 760, minWidth: 720, minHeight: 560,
      title: 'ESPN Login', show: true,
      webPreferences: { partition: ESPN_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
    });
    loginWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (isAllowedLoginUrl(url)) return { action: 'allow', overrideBrowserWindowOptions: { parent: loginWindow ?? undefined, webPreferences: { partition: ESPN_PARTITION, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } } };
      if (url.startsWith('https://')) void shell.openExternal(url); return { action: 'deny' };
    });
    loginWindow.webContents.on('will-navigate', (event: Event, url: string) => { if (!isAllowedLoginUrl(url)) event.preventDefault(); });
    loginWindow.once('ready-to-show', () => loginWindow?.show());
    loginWindow.on('close', (event) => { if (discoveryActive && !allowDiscoveryClose) event.preventDefault(); });
    loginWindow.once('closed', () => { loginWindow = null; if (authenticated && discoveryActive) finish('authenticated'); else if (!authenticated) finish('cancelled'); });
    espnSession.cookies.on('changed', onCookieChanged);
    startDiscoveryRuntime(loginWindow.webContents, espnSession, () => hasRealEspnSession(espnSession));
    endDiscoveryCallback = () => finish('authenticated');
    const timer = setTimeout(() => finish('timeout'), LOGIN_TIMEOUT_MS);
    void loginWindow.loadURL(LOGIN_URL).catch(() => { if (!discoveryActive && !authenticated) finish('cancelled'); });
  });
  return pendingLogin;
}

export function cancelEspnLogin(): void {
  if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
}

export function endEspnDiscovery(): boolean {
  if (!diagnosticsEnabled() || !endDiscoveryCallback) return false;
  endDiscoveryCallback(); return true;
}

