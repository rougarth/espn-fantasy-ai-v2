import { describe, expect, it } from 'vitest';
import { analyzeDiscovery, classifyDiscoveryRecord } from '../../src/main/espn/discovery-analyzer';
import { DiscoveryRecordSchema, type DiscoveryRecord } from '../../src/main/espn/discovery-types';

const base: DiscoveryRecord = { timestamp: '2026-07-20T00:00:00.000Z', event: 'completed', host: 'fantasy.espn.com', pathname: '/apis/league', method: 'GET', status: 200, contentType: 'application/json', queryKeys: ['season'], redirects: 0, resourceType: 'xhr', returnedJson: true, jsonKind: 'object', topLevelKeys: ['items'], itemCount: 1, session: 'present', relevance: 'high' };

describe('discovery analysis', () => {
  it('classifies ESPN Fantasy JSON as high relevance', () => { expect(classifyDiscoveryRecord(base)).toBe('high'); });
  it('does not mark observed candidates as confirmed automatically', () => {
    const analysis = analyzeDiscovery([base]); expect(analysis.candidates).toEqual([{ host: 'fantasy.espn.com', pathname: '/apis/league', method: 'GET', reason: 'candidato observado', confirmed: false }]);
  });
  it('treats HTML as non-JSON', () => {
    const html = { ...base, contentType: 'text/html', returnedJson: false, jsonKind: undefined, topLevelKeys: undefined, itemCount: undefined };
    expect(analyzeDiscovery([html]).hostsWithJson).toEqual([]);
  });
  it('export schema rejects headers, bodies, cookies, and unknown sensitive fields', () => {
    expect(DiscoveryRecordSchema.safeParse({ ...base, headers: { Authorization: 'secret' } }).success).toBe(false);
    expect(DiscoveryRecordSchema.safeParse({ ...base, requestBody: 'secret' }).success).toBe(false);
    expect(DiscoveryRecordSchema.safeParse({ ...base, cookies: 'secret' }).success).toBe(false);
  });
  it('contains query keys without any values', () => { expect(JSON.stringify(DiscoveryRecordSchema.parse(base))).not.toContain('2026-value'); });
});
