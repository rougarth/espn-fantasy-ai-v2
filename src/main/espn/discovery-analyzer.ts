import type { DiscoveryAnalysis, DiscoveryRecord } from './discovery-types';

const HIGH_CONCEPT = /league|team|member|roster|matchup|standing|fantasy/i;
const MEDIUM_CONCEPT = /profile|identity|user|account|season/i;
const LOW_CONCEPT = /analytics|telemetry|advert|doubleclick|image|font|stylesheet/i;

export function classifyDiscoveryRecord(record: Pick<DiscoveryRecord, 'host' | 'pathname' | 'queryKeys' | 'returnedJson' | 'resourceType'>): DiscoveryRecord['relevance'] {
  const searchable = `${record.host} ${record.pathname} ${record.queryKeys.join(' ')}`;
  if ((record.returnedJson && /fantasy\.espn\.com$/i.test(record.host)) || HIGH_CONCEPT.test(searchable)) return 'high';
  if (MEDIUM_CONCEPT.test(searchable)) return 'medium';
  if (LOW_CONCEPT.test(searchable) || /image|font|stylesheet/i.test(record.resourceType ?? '')) return 'low';
  return record.returnedJson ? 'medium' : 'low';
}

function frequency(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function analyzeDiscovery(records: DiscoveryRecord[]): DiscoveryAnalysis {
  const json = records.filter((record) => record.returnedJson);
  const relevant = records.filter((record) => record.relevance === 'high');
  return {
    hostsWithJson: frequency(json.map((record) => record.host)), methods: frequency(records.map((record) => record.method)),
    statuses: frequency(records.flatMap((record) => record.status === undefined ? [] : [String(record.status)])),
    contentTypes: frequency(records.flatMap((record) => record.contentType ? [record.contentType] : [])),
    topLevelKeys: frequency(json.flatMap((record) => record.topLevelKeys ?? [])),
    relevantPathnames: frequency(relevant.map((record) => record.pathname)),
    candidates: relevant.filter((record) => record.returnedJson).map((record) => ({ host: record.host, pathname: record.pathname, method: record.method, reason: 'candidato observado' as const, confirmed: false as const }))
  };
}
