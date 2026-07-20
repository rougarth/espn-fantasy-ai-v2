import { app, type WebContents } from 'electron';
import { describeJson, safeDiagnosticEvent } from './diagnostic-sanitizer';

const RELEVANT = /fantasy|league|membership|team|profile|user/i;

type DebuggerEvent = {
  requestId?: string;
  request?: { url?: string; method?: string };
  response?: { url?: string; status?: number; mimeType?: string };
  redirectResponse?: unknown;
};

export function diagnosticsEnabled(): boolean {
  return !app.isPackaged && process.env.ESPN_DIAGNOSTICS === '1';
}

export function attachEspnDiscovery(webContents: WebContents, sessionState: () => Promise<boolean>): () => void {
  if (!diagnosticsEnabled()) return () => undefined;
  const redirects = new Map<string, number>();
  const requests = new Map<string, { url: string; method: string; status?: number; contentType?: string }>();
  try { webContents.debugger.attach('1.3'); } catch { return () => undefined; }
  const onMessage = async (_event: Electron.Event, method: string, params: DebuggerEvent) => {
    const requestId = params.requestId;
    if (!requestId) return;
    if (method === 'Network.requestWillBeSent' && params.request?.url) {
      if (params.redirectResponse) redirects.set(requestId, (redirects.get(requestId) ?? 0) + 1);
      requests.set(requestId, { url: params.request.url, method: params.request.method ?? 'GET' });
    }
    if (method === 'Network.responseReceived' && params.response?.url) {
      const current = requests.get(requestId) ?? { url: params.response.url, method: 'GET' };
      requests.set(requestId, { ...current, status: params.response.status, contentType: params.response.mimeType });
    }
    if (method === 'Network.loadingFinished') {
      const request = requests.get(requestId);
      requests.delete(requestId);
      if (!request || !RELEVANT.test(request.url)) return;
      let jsonShape;
      if (request.contentType?.includes('json')) {
        try {
          const body = await webContents.debugger.sendCommand('Network.getResponseBody', { requestId }) as { body: string };
          jsonShape = describeJson(JSON.parse(body.body));
        } catch { /* A body may be unavailable for cached or redirected responses. */ }
      }
      console.info('[espn-diagnostic]', JSON.stringify(safeDiagnosticEvent({
        event: 'network-response', url: request.url, method: request.method, status: request.status,
        contentType: request.contentType, redirects: redirects.get(requestId), sessionPresent: await sessionState(), jsonShape
      })));
      redirects.delete(requestId);
    }
  };
  webContents.debugger.on('message', onMessage);
  void webContents.debugger.sendCommand('Network.enable');
  return () => { webContents.debugger.removeListener('message', onMessage); if (webContents.debugger.isAttached()) webContents.debugger.detach(); };
}

