import { describe, expect, it, vi } from 'vitest';
import { clearEspnSession, hasRealEspnSession } from '../../src/main/auth/espn-session';

const sessionWith = (cookies: Array<{ name: string; value: string }>) => ({ cookies: { get: vi.fn().mockResolvedValue(cookies) }, clearStorageData: vi.fn().mockResolvedValue(undefined) });
describe('ESPN session', () => {
  it('requires both non-empty real session cookies', async () => {
    expect(await hasRealEspnSession(sessionWith([{ name: 'espn_s2', value: 'secret' }]) as never)).toBe(false);
    expect(await hasRealEspnSession(sessionWith([{ name: 'espn_s2', value: 'secret' }, { name: 'SWID', value: '{id}' }]) as never)).toBe(true);
  });
  it('clears persistent session storage', async () => {
    const fake = sessionWith([]); await clearEspnSession(fake as never);
    expect(fake.clearStorageData).toHaveBeenCalledWith({ storages: ['cookies', 'localstorage', 'cachestorage', 'serviceworkers'] });
  });
});

