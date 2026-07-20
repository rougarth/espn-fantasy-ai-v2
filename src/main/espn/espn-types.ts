import { z } from 'zod';

export const LeagueDtoSchema = z.object({
  name: z.string().min(1),
  season: z.number().int().optional(),
  sport: z.string().min(1).optional(),
  status: z.string().min(1).optional()
}).strict();

export const LeagueListSchema = z.array(LeagueDtoSchema);
export type LeagueDto = z.infer<typeof LeagueDtoSchema>;

export type EspnErrorCode =
  | 'no_internet'
  | 'session_expired'
  | 'unexpected_html'
  | 'endpoint_unavailable'
  | 'rate_limited'
  | 'unrecognized_response';

export type LeagueListResult =
  | { ok: true; leagues: LeagueDto[] }
  | { ok: false; error: EspnErrorCode };

export type JsonShape = {
  kind: 'array' | 'object' | 'primitive';
  topLevelKeys?: string[];
  itemCount?: number;
};

