import { app, type WebContents } from 'electron';
import { describeJson } from './diagnostic-sanitizer';
import type { DiscoveryCollector } from './discovery-collector';

type DebuggerEvent = { requestId?: string; request?: { url?: string; method?: string }; response?: { url?: string; status?: number; mimeType?: string }; redirectResponse?: unknown };

export function diagnosticsEnabled(): boolean { return !app.isPackaged && process.env.ESPN_DIAGNOSTICS === '1'; }

export function attachEspnDiscovery(webContents: WebContents, collector: DiscoveryCollector): () => void {
  if (!diagnosticsEnabled()) return () => undefined;
  const responses = new Map<string, { url: string; contentType?: string }>();
  try { webContents.debugger.attach('1.3'); } catch { return () => undefined; }
  const onMessage = async (_event: Electron.Event, method: string, params: DebuggerEvent) => {
    if (!params.requestId) return;
    if (method === 'Network.requestWillBeSent' && params.request?.url && params.redirectResponse) collector.noteRedirect(params.request.url, params.request.method);
    if (method === 'Network.responseReceived' && params.response?.url) responses.set(params.requestId, { url: params.response.url, contentType: params.response.mimeType });
    if (method === 'Network.loadingFinished') {
      const response = responses.get(params.requestId); responses.delete(params.requestId);
      if (!response?.contentType?.includes('json')) return;
      try {
        const body = await webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId }) as { body: string };
        collector.enrichJson(response.url, describeJson(JSON.parse(body.body)));
      } catch { /* Cached and redirected bodies can be unavailable. */ }
    }
  };
  webContents.debugger.on('message', onMessage);
  void webContents.debugger.sendCommand('Network.enable');
  return () => { webContents.debugger.removeListener('message', onMessage); if (webContents.debugger.isAttached()) webContents.debugger.detach(); };
}
