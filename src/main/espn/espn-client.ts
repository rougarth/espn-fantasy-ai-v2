import type { Session } from 'electron';
import type { z } from 'zod';
import { EspnClientError } from './espn-errors';
import { hasRealEspnSession } from './espn-session';

export class EspnClient {
  constructor(private readonly espnSession: Session) {}

  async requestJson<T>(url: URL, schema: z.ZodType<T>): Promise<T> {
    if (!await hasRealEspnSession(this.espnSession)) throw new EspnClientError('session_expired', 'ESPN session is absent');
    let response: Response;
    try { response = await this.espnSession.fetch(url.toString(), { method: 'GET', redirect: 'follow' }); }
    catch (error) { throw new EspnClientError('no_internet', 'ESPN request failed', { cause: error }); }
    if (response.status === 401 || response.status === 403) throw new EspnClientError('session_expired', 'ESPN rejected the session');
    if (response.status === 429) throw new EspnClientError('rate_limited', 'ESPN rate limit reached');
    if (!response.ok) throw new EspnClientError('endpoint_unavailable', `ESPN returned ${response.status}`);
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('text/html')) throw new EspnClientError('unexpected_html', 'Expected JSON but received HTML');
    if (!contentType.includes('json')) throw new EspnClientError('unrecognized_response', 'Response content type is not JSON');
    let payload: unknown;
    try { payload = await response.json(); } catch (error) { throw new EspnClientError('unrecognized_response', 'Invalid JSON response', { cause: error }); }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) throw new EspnClientError('unrecognized_response', 'JSON shape was not recognized');
    return parsed.data;
  }
}

