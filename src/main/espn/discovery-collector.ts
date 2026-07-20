import type { Session } from 'electron';
import { sanitizeUrl } from './diagnostic-sanitizer';
import { classifyDiscoveryRecord } from './discovery-analyzer';
import { DiscoveryRecordSchema, type DiscoveryRecord, type DiscoverySnapshot } from './discovery-types';

type Pending = Omit<DiscoveryRecord, 'event' | 'returnedJson' | 'session' | 'relevance'> & { id: number; returnedJson?: boolean; session?: 'present' | 'absent' };
const OFFICIAL_URLS = ['*://*.espn.com/*', '*://espn.com/*', '*://*.go.com/*', '*://go.com/*', '*://*.disney.com/*', '*://*.disneyid.com/*'];
const safePath = (pathname: string) => pathname.split('/').map((part) => /^\d{4,}$|^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(part) ? ':id' : part).join('/');
const safeOrigin = (origin?: string) => { if (!origin) return undefined; try { return new URL(origin).hostname; } catch { return undefined; } };

export class DiscoveryCollector {
  private readonly pending = new Map<number, Pending>();
  private readonly records: DiscoveryRecord[] = [];
  private redirects = new Map<string, number>();
  constructor(private readonly espnSession: Session, private readonly sessionState: () => Promise<boolean>) {}

  start(): void {
    const filter = { urls: OFFICIAL_URLS };
    this.espnSession.webRequest.onBeforeRequest(filter, (details, callback) => {
      const url = sanitizeUrl(details.url);
      this.pending.set(details.id, { id: details.id, timestamp: new Date().toISOString(), host: url.host, pathname: safePath(url.pathname), method: details.method, queryKeys: url.queryKeys, redirects: 0, resourceType: details.resourceType, initiatorOrigin: safeOrigin(details.referrer) });
      callback({});
    });
    this.espnSession.webRequest.onBeforeSendHeaders(filter, (_details, callback) => callback({}));
    this.espnSession.webRequest.onHeadersReceived(filter, (details, callback) => {
      const pending = this.pending.get(details.id); const contentType = details.responseHeaders?.['content-type']?.[0] ?? details.responseHeaders?.['Content-Type']?.[0];
      if (pending) { pending.status = details.statusCode; pending.contentType = contentType?.split(';')[0]; pending.returnedJson = pending.contentType?.includes('json') ?? false; }
      callback({});
    });
    this.espnSession.webRequest.onCompleted(filter, (details) => { void this.finalize(details.id, 'completed'); });
    this.espnSession.webRequest.onErrorOccurred(filter, (details) => { void this.finalize(details.id, 'error'); });
  }

  noteRedirect(url: string, method = 'GET'): void { const sanitized = sanitizeUrl(url); const key = `${method} ${sanitized.host}${safePath(sanitized.pathname)}`; this.redirects.set(key, (this.redirects.get(key) ?? 0) + 1); }
  enrichJson(url: string, shape: { kind: 'array' | 'object' | 'string' | 'primitive'; topLevelKeys?: string[]; itemCount?: number }): void {
    const sanitized = sanitizeUrl(url); const pathname = safePath(sanitized.pathname);
    const record = [...this.records].reverse().find((item) => item.host === sanitized.host && item.pathname === pathname);
    if (!record) return;
    record.returnedJson = true; record.jsonKind = shape.kind === 'primitive' ? 'primitive' : shape.kind; record.topLevelKeys = shape.topLevelKeys; record.itemCount = shape.itemCount;
    record.relevance = classifyDiscoveryRecord(record);
  }
  snapshot(): DiscoverySnapshot { return { totalRequests: this.records.length, jsonResponses: this.records.filter((item) => item.returnedJson).length, hosts: [...new Set(this.records.map((item) => item.host))].sort(), highRelevance: this.records.filter((item) => item.relevance === 'high') }; }
  all(): DiscoveryRecord[] { return this.records.map((record) => DiscoveryRecordSchema.parse(record)); }
  stop(): void { this.espnSession.webRequest.onBeforeRequest(null); this.espnSession.webRequest.onBeforeSendHeaders(null); this.espnSession.webRequest.onHeadersReceived(null); this.espnSession.webRequest.onCompleted(null); this.espnSession.webRequest.onErrorOccurred(null); this.pending.clear(); }

  private async finalize(id: number, event: 'completed' | 'error'): Promise<void> {
    const pending = this.pending.get(id); if (!pending) return; this.pending.delete(id);
    const { id: _id, ...safe } = pending; void _id;
    safe.redirects = this.redirects.get(`${safe.method} ${safe.host}${safe.pathname}`) ?? safe.redirects; this.redirects.delete(`${safe.method} ${safe.host}${safe.pathname}`);
    const base = { ...safe, event, returnedJson: safe.returnedJson ?? false, session: await this.sessionState() ? 'present' as const : 'absent' as const };
    this.records.push(DiscoveryRecordSchema.parse({ ...base, relevance: classifyDiscoveryRecord(base) }));
  }
}
