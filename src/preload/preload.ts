import { contextBridge, ipcRenderer } from 'electron';

export type LoginResult = 'authenticated' | 'cancelled' | 'timeout';
export type LeagueDto = { name: string; season?: number; sport?: string; status?: string };
export type EspnErrorCode = 'no_internet' | 'session_expired' | 'unexpected_html' | 'endpoint_unavailable' | 'rate_limited' | 'unrecognized_response';
export type LeagueListResult = { ok: true; leagues: LeagueDto[] } | { ok: false; error: EspnErrorCode };
export interface EspnAuthApi {
  status(): Promise<boolean>;
  login(): Promise<LoginResult>;
  cancel(): Promise<void>;
  logout(): Promise<boolean>;
  clear(): Promise<boolean>;
  listLeagues(): Promise<LeagueListResult>;
}
const invoke = <T>(channel: string): Promise<T> => ipcRenderer.invoke(channel, {});
contextBridge.exposeInMainWorld('espnAuth', {
  status: () => invoke<boolean>('auth:status'), login: () => invoke<LoginResult>('auth:login'),
  cancel: () => invoke<void>('auth:cancel'), logout: () => invoke<boolean>('auth:logout'), clear: () => invoke<boolean>('auth:clear'),
  listLeagues: () => invoke<LeagueListResult>('leagues:list')
} satisfies EspnAuthApi);

