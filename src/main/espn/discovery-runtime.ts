import { dialog, type Session, type WebContents } from 'electron';
import { writeFile } from 'node:fs/promises';
import { analyzeDiscovery } from './discovery-analyzer';
import { DiscoveryCollector } from './discovery-collector';
import { attachEspnDiscovery, diagnosticsEnabled } from './espn-discovery';
import type { DiscoveryAnalysis, DiscoverySnapshot } from './discovery-types';

let collector: DiscoveryCollector | null = null;
let detachDebugger: (() => void) | null = null;

export function startDiscoveryRuntime(webContents: WebContents, espnSession: Session, sessionState: () => Promise<boolean>): void {
  if (!diagnosticsEnabled()) return;
  stopDiscoveryRuntime(true); collector = new DiscoveryCollector(espnSession, sessionState); collector.start(); detachDebugger = attachEspnDiscovery(webContents, collector);
}
export function discoverySnapshot(): DiscoverySnapshot { return collector?.snapshot() ?? { totalRequests: 0, jsonResponses: 0, hosts: [], highRelevance: [] }; }
export function discoveryAnalysis(): DiscoveryAnalysis { return analyzeDiscovery(collector?.all() ?? []); }
export async function exportSanitizedDiscovery(): Promise<boolean> {
  if (!diagnosticsEnabled() || !collector) return false;
  const result = await dialog.showSaveDialog({ title: 'Exportar diagnóstico sanitizado', defaultPath: 'espn-diagnostic-sanitized.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return false;
  await writeFile(result.filePath, `${JSON.stringify({ records: collector.all(), analysis: discoveryAnalysis() }, null, 2)}\n`, 'utf8'); return true;
}
export function stopDiscoveryRuntime(clear = false): void { detachDebugger?.(); detachDebugger = null; collector?.stop(); if (clear) collector = null; }
