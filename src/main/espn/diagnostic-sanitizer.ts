import type { JsonShape } from './espn-types';

const SENSITIVE_QUERY_KEYS = /token|auth|code|cookie|credential|password|secret|session|email/i;

export type SanitizedUrl = { host: string; pathname: string; queryKeys: string[] };

export function sanitizeUrl(urlString: string): SanitizedUrl {
  const url = new URL(urlString);
  return {
    host: url.hostname,
    pathname: url.pathname,
    queryKeys: [...new Set([...url.searchParams.keys()])].filter((key) => !SENSITIVE_QUERY_KEYS.test(key)).sort()
  };
}

export function describeJson(value: unknown): JsonShape {
  if (Array.isArray(value)) return { kind: 'array', itemCount: value.length };
  if (value !== null && typeof value === 'object') return { kind: 'object', topLevelKeys: Object.keys(value).sort() };
  if (typeof value === 'string') return { kind: 'string' };
  return { kind: 'primitive' };
}

export function safeDiagnosticEvent(input: {
  event: string; url: string; method?: string; status?: number; contentType?: string;
  redirects?: number; sessionPresent?: boolean; jsonShape?: JsonShape;
}) {
  const sanitized = sanitizeUrl(input.url);
  return {
    event: input.event,
    ...sanitized,
    method: input.method,
    status: input.status,
    contentType: input.contentType?.split(';')[0],
    redirects: input.redirects ?? 0,
    timestamp: new Date().toISOString(),
    session: input.sessionPresent === undefined ? undefined : input.sessionPresent ? 'present' : 'absent',
    returnedJson: input.jsonShape !== undefined,
    jsonShape: input.jsonShape
  };
}
