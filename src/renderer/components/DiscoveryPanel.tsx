import { useEffect, useState } from 'react';
import type { DiscoverySnapshot } from '../../preload/preload';
import type { Language } from '../i18n/translations';

const empty: DiscoverySnapshot = { totalRequests: 0, jsonResponses: 0, hosts: [], highRelevance: [] };
export function DiscoveryPanel({ language, ended, onEnd }: { language: Language; ended: boolean; onEnd: () => Promise<void> }) {
  const [snapshot, setSnapshot] = useState(empty);
  useEffect(() => {
    let active = true; const refresh = () => void window.espnAuth.discoverySnapshot().then((value) => { if (active) setSnapshot(value); });
    refresh(); const timer = setInterval(refresh, 1_000); return () => { active = false; clearInterval(timer); };
  }, []);
  const pt = language === 'pt';
  return <section className="discovery-panel" aria-label={pt ? 'Diagnóstico ESPN' : 'ESPN diagnostics'}>
    <h2>{pt ? 'Descoberta ESPN' : 'ESPN discovery'}</h2>
    <p>{pt ? 'Login confirmado. Agora abra sua liga da ESPN nesta janela.' : 'Sign-in confirmed. Now open your ESPN league in this window.'}</p>
    <div className="diagnostic-counts"><span>{pt ? 'Requisições' : 'Requests'}: {snapshot.totalRequests}</span><span>JSON: {snapshot.jsonResponses}</span><span>{pt ? 'Hosts' : 'Hosts'}: {snapshot.hosts.length}</span></div>
    {snapshot.hosts.length > 0 && <p className="hosts">{snapshot.hosts.join(', ')}</p>}
    <div className="diagnostic-list">{snapshot.highRelevance.slice(-20).map((record, index) => <article key={`${record.timestamp}-${index}`}><strong>{record.method} {record.pathname}</strong><span>{record.status ?? '—'} · {record.contentType ?? '—'}</span>{record.topLevelKeys?.length ? <small>{record.topLevelKeys.join(', ')}</small> : null}</article>)}</div>
    <div className="actions"><button disabled={ended} onClick={() => void window.espnAuth.openFantasyFootball()}>{pt ? 'Abrir Fantasy Football na janela monitorada' : 'Open Fantasy Football in monitored window'}</button><button disabled={ended} onClick={() => void onEnd()}>{pt ? 'Encerrar descoberta' : 'End discovery'}</button><button className="secondary" onClick={() => void window.espnAuth.exportDiscovery()}>{pt ? 'Exportar diagnóstico sanitizado' : 'Export sanitized diagnostics'}</button></div>
  </section>;
}
