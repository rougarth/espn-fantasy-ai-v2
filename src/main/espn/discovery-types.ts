import { z } from 'zod';

export const RelevanceSchema = z.enum(['high', 'medium', 'low']);
export const DiscoveryRecordSchema = z.object({
  timestamp: z.string().datetime(), event: z.enum(['completed', 'error']), host: z.string(), pathname: z.string(),
  method: z.string(), status: z.number().int().optional(), contentType: z.string().optional(), queryKeys: z.array(z.string()),
  redirects: z.number().int().nonnegative(), initiatorOrigin: z.string().optional(), resourceType: z.string().optional(),
  returnedJson: z.boolean(), jsonKind: z.enum(['array', 'object', 'string', 'primitive']).optional(),
  topLevelKeys: z.array(z.string()).optional(), itemCount: z.number().int().nonnegative().optional(),
  session: z.enum(['present', 'absent']), relevance: RelevanceSchema
}).strict();

export type DiscoveryRecord = z.infer<typeof DiscoveryRecordSchema>;
export type DiscoverySnapshot = { totalRequests: number; jsonResponses: number; hosts: string[]; highRelevance: DiscoveryRecord[] };
export type DiscoveryAnalysis = { hostsWithJson: Array<{ value: string; count: number }>; methods: Array<{ value: string; count: number }>; statuses: Array<{ value: string; count: number }>; contentTypes: Array<{ value: string; count: number }>; topLevelKeys: Array<{ value: string; count: number }>; relevantPathnames: Array<{ value: string; count: number }>; candidates: Array<{ host: string; pathname: string; method: string; reason: 'candidato observado'; confirmed: false }> };
