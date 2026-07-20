import { describe, expect, it } from 'vitest';
import { describeJson, safeDiagnosticEvent, sanitizeUrl } from '../../src/main/espn/diagnostic-sanitizer';
import { isAllowedLoginUrl } from '../../src/main/espn/login-domains';

describe('safe ESPN diagnostics', () => {
  it('keeps query keys but removes sensitive keys and every value', () => {
    const sanitized = sanitizeUrl('https://fantasy.espn.com/path?season=2026&token=secret&view=mTeam');
    expect(sanitized).toEqual({ host: 'fantasy.espn.com', pathname: '/path', queryKeys: ['season', 'view'] });
    expect(JSON.stringify(sanitized)).not.toContain('secret');
    expect(JSON.stringify(sanitized)).not.toContain('2026');
    expect(JSON.stringify(sanitized)).not.toContain('mTeam');
  });
  it('describes JSON only at the surface', () => {
    expect(describeJson([{ private: 'hidden' }])).toEqual({ kind: 'array', itemCount: 1 });
    expect(describeJson({ leagues: [{ private: 'hidden' }], profile: {} })).toEqual({ kind: 'object', topLevelKeys: ['leagues', 'profile'] });
  });
  it('emits only sanitized diagnostic fields', () => {
    const output = safeDiagnosticEvent({ event: 'network-response', url: 'https://www.espn.com/api?token=secret', method: 'GET', status: 200, contentType: 'application/json; charset=utf-8', sessionPresent: true });
    expect(output).toMatchObject({ host: 'www.espn.com', pathname: '/api', queryKeys: [], session: 'present', contentType: 'application/json' });
    expect(JSON.stringify(output)).not.toContain('secret');
  });
  it('allows official subdomains and rejects deceptive domains', () => {
    expect(isAllowedLoginUrl('https://registerdisney.go.com/login')).toBe(true);
    expect(isAllowedLoginUrl('https://www.espn.com/login')).toBe(true);
    expect(isAllowedLoginUrl('https://espn.com.attacker.example/login')).toBe(false);
    expect(isAllowedLoginUrl('http://www.espn.com/login')).toBe(false);
  });
});

