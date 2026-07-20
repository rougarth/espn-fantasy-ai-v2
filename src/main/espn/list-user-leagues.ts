import type { Session } from 'electron';
import { CONFIRMED_LEAGUES_ENDPOINT } from './confirmed-endpoints';
import { EspnClient } from './espn-client';
import { EspnClientError, mapEspnError } from './espn-errors';
import { LeagueListSchema, type LeagueListResult } from './espn-types';
import { hasRealEspnSession } from './espn-session';

export async function listUserLeagues(espnSession: Session): Promise<LeagueListResult> {
  try {
    const client = new EspnClient(espnSession);
    if (!await hasRealEspnSession(espnSession)) {
      throw new EspnClientError('session_expired', 'ESPN session is absent');
    }
    if (!CONFIRMED_LEAGUES_ENDPOINT) throw new EspnClientError('endpoint_unavailable', 'No leagues endpoint has been confirmed');
    return { ok: true, leagues: await client.requestJson(CONFIRMED_LEAGUES_ENDPOINT, LeagueListSchema) };
  } catch (error) {
    return { ok: false, error: mapEspnError(error) };
  }
}
