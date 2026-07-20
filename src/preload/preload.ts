import { contextBridge, ipcRenderer } from 'electron';

export type LoginResult = 'authenticated' | 'cancelled' | 'timeout';
export interface EspnAuthApi {
  status(): Promise<boolean>;
  login(): Promise<LoginResult>;
  cancel(): Promise<void>;
  logout(): Promise<boolean>;
  clear(): Promise<boolean>;
}
const invoke = <T>(channel: string): Promise<T> => ipcRenderer.invoke(channel, {});
contextBridge.exposeInMainWorld('espnAuth', {
  status: () => invoke<boolean>('auth:status'), login: () => invoke<LoginResult>('auth:login'),
  cancel: () => invoke<void>('auth:cancel'), logout: () => invoke<boolean>('auth:logout'), clear: () => invoke<boolean>('auth:clear')
} satisfies EspnAuthApi);

