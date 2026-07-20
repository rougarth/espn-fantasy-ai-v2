import { describe, expect, it, vi } from 'vitest';
import { EspnClient } from '../../src/main/espn/espn-client';
import { EspnClientError, mapEspnError } from '../../src/main/espn/espn-errors';
import { LeagueListSchema } from '../../src/main/espn/espn-types';
import { listUserLeagues } from '../../src/main/espn/list-user-leagues';

function fakeSession(response?: Response, cookies = [{ name: 'espn_s2', value: 'test-only' }, { name: 'SWID', value: 'test-only' }]) {
  return { cookies: { get: vi.fn().mockResolvedValue(cookies) }, fetch: vi.fn().mockResolvedValue(response) };
}

describe('ESPN client validation', () => {
  it('accepts only a known valid safe league DTO response', async () => {
    const session = fakeSession(new Response(JSON.stringify([{ name: 'Real response fixture', season: 2026 }]), { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(new EspnClient(session as never).requestJson(new URL('https://www.espn.com/test'), LeagueListSchema)).resolves.toEqual([{ name: 'Real response fixture', season: 2026 }]);
  });
  it('rejects HTML even with a successful status', async () => {
    const session = fakeSession(new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    await expect(new EspnClient(session as never).requestJson(new URL('https://www.espn.com/test'), LeagueListSchema)).rejects.toMatchObject({ code: 'unexpected_html' });
  });
  it('rejects unexpected JSON and fields that could leak cookies', async () => {
    expect(LeagueListSchema.safeParse({ leagues: [] }).success).toBe(false);
    expect(LeagueListSchema.safeParse([{ name: 'League', espn_s2: 'not-allowed' }]).success).toBe(false);
  });
  it('maps errors to stable renderer-safe codes', () => {
    expect(mapEspnError(new EspnClientError('rate_limited', 'test'))).toBe('rate_limited');
    expect(mapEspnError(new TypeError('network'))).toBe('no_internet');
    expect(mapEspnError(new Error('unknown'))).toBe('endpoint_unavailable');
  });
  it('blocks listing when the persistent session is absent', async () => {
    await expect(listUserLeagues(fakeSession(undefined, []) as never)).resolves.toEqual({ ok: false, error: 'session_expired' });
  });
  it('an empty validated response remains empty', () => {
    expect(LeagueListSchema.parse([])).toEqual([]);
  });
});
