import type { Session } from 'electron';

const ESPN_COOKIE_URL = 'https://www.espn.com';
const SESSION_COOKIE_NAMES = new Set(['espn_s2', 'SWID']);

export async function hasRealEspnSession(espnSession: Session): Promise<boolean> {
  const cookies = await espnSession.cookies.get({ url: ESPN_COOKIE_URL });
  const names = new Set(cookies.filter((cookie) => cookie.value.length > 0).map((cookie) => cookie.name));
  return [...SESSION_COOKIE_NAMES].every((name) => names.has(name));
}

export async function clearEspnSession(espnSession: Session): Promise<void> {
  await espnSession.clearStorageData({ storages: ['cookies', 'localstorage', 'cachestorage', 'serviceworkers'] });
}

