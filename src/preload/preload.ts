import { contextBridge, ipcRenderer } from 'electron';

export type LoginResult = 'authenticated' | 'cancelled' | 'timeout';
export type LeagueDto = { name: string; season?: number; sport?: string; status?: string };
export type EspnErrorCode = 'no_internet' | 'session_expired' | 'unexpected_html' | 'endpoint_unavailable' | 'rate_limited' | 'unrecognized_response';
export type LeagueListResult = { ok: true; leagues: LeagueDto[] } | { ok: false; error: EspnErrorCode };
export type DiscoveryRecord = { timestamp: string; event: 'completed' | 'error'; host: string; pathname: string; method: string; status?: number; contentType?: string; queryKeys: string[]; redirects: number; initiatorOrigin?: string; resourceType?: string; returnedJson: boolean; jsonKind?: 'array' | 'object' | 'string' | 'primitive'; topLevelKeys?: string[]; itemCount?: number; session: 'present' | 'absent'; relevance: 'high' | 'medium' | 'low' };
export type DiscoverySnapshot = { totalRequests: number; jsonResponses: number; hosts: string[]; highRelevance: DiscoveryRecord[] };
export interface EspnAuthApi {
  status(): Promise<boolean>;
  login(): Promise<LoginResult>;
  cancel(): Promise<void>;
  logout(): Promise<boolean>;
  clear(): Promise<boolean>;
  listLeagues(): Promise<LeagueListResult>;
  discoveryEnabled(): Promise<boolean>;
  discoverySnapshot(): Promise<DiscoverySnapshot>;
  exportDiscovery(): Promise<boolean>;
  openFantasyFootball(): Promise<boolean>;
  endDiscovery(): Promise<boolean>;
  onDiscoveryStarted(callback: () => void): () => void;
}
const invoke = <T>(channel: string): Promise<T> => ipcRenderer.invoke(channel, {});
contextBridge.exposeInMainWorld('espnAuth', {
  status: () => invoke<boolean>('auth:status'), login: () => invoke<LoginResult>('auth:login'),
  cancel: () => invoke<void>('auth:cancel'), logout: () => invoke<boolean>('auth:logout'), clear: () => invoke<boolean>('auth:clear'),
  listLeagues: () => invoke<LeagueListResult>('leagues:list'), discoveryEnabled: () => invoke<boolean>('discovery:enabled'),
  discoverySnapshot: () => invoke<DiscoverySnapshot>('discovery:snapshot'), exportDiscovery: () => invoke<boolean>('discovery:export'),
  openFantasyFootball: () => invoke<boolean>('discovery:open-football'),
  endDiscovery: () => invoke<boolean>('discovery:end'),
  onDiscoveryStarted: (callback: () => void) => { const listener = () => callback(); ipcRenderer.on('discovery:started', listener); return () => ipcRenderer.removeListener('discovery:started', listener); }
} satisfies EspnAuthApi);

