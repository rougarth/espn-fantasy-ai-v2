import { useEffect, useState } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { translations, type Language } from './i18n/translations';
import type { EspnErrorCode, LeagueDto } from '../preload/preload';
import { DiscoveryPanel } from './components/DiscoveryPanel';

type Status = 'idle' | 'connecting' | 'connected' | 'cancelled' | 'timeout';
export default function App() {
  const [language, setLanguage] = useState<Language>('pt');
  const [status, setStatus] = useState<Status>('idle');
  const [help, setHelp] = useState(false);
  const [leagueState, setLeagueState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [leagues, setLeagues] = useState<LeagueDto[]>([]);
  const [leagueError, setLeagueError] = useState<EspnErrorCode>();
  const [discoveryActive, setDiscoveryActive] = useState(false);
  const [discoveryEnded, setDiscoveryEnded] = useState(false);
  const t = translations[language];
  useEffect(() => { void window.espnAuth.status().then((ok) => setStatus(ok ? 'connected' : 'idle')); return window.espnAuth.onDiscoveryStarted(() => { setDiscoveryActive(true); setDiscoveryEnded(false); }); }, []);
  const login = async () => { setStatus('connecting'); const result = await window.espnAuth.login(); setStatus(result === 'authenticated' ? 'connected' : result); };
  const logout = async () => { await window.espnAuth.logout(); setStatus('idle'); };
  const clear = async () => { await window.espnAuth.clear(); setStatus('idle'); };
  const loadLeagues = async () => {
    setLeagueState('loading');
    const result = await window.espnAuth.listLeagues();
    if (result.ok) { setLeagues(result.leagues); setLeagueState('loaded'); }
    else { setLeagueError(result.error); setLeagueState('error'); }
  };
  const loginAgain = async () => { await window.espnAuth.clear(); setLeagueState('idle'); setStatus('idle'); await login(); };
  const endDiscovery = async () => { await window.espnAuth.endDiscovery(); setDiscoveryEnded(true); };
  const errorMessage = leagueError === 'no_internet' ? t.noInternet : leagueError === 'session_expired' ? t.sessionExpired : leagueError === 'unexpected_html' || leagueError === 'unrecognized_response' ? t.unrecognized : t.unavailable;
  if (status === 'connected') return <main className="shell connected"><div className="top"><LanguageSelector value={language} onChange={setLanguage} label={t.language}/></div><h1>ESPN Fantasy AI</h1><p role="status">{t.connected}</p>{discoveryActive && <DiscoveryPanel language={language} ended={discoveryEnded} onEnd={endDiscovery}/>} {!discoveryActive && leagueState === 'idle' && <button className="connect" onClick={loadLeagues}>{t.loadLeagues}</button>}{leagueState === 'loading' && <p aria-live="polite">{t.loadingLeagues}</p>}{leagueState === 'error' && <section className="league-result"><p role="alert">{errorMessage}</p><div className="actions"><button onClick={loadLeagues}>{t.retry}</button><button className="secondary" onClick={loginAgain}>{t.loginAgain}</button></div></section>}{leagueState === 'loaded' && <section className="league-result">{leagues.length === 0 ? <p>{t.noLeagues}</p> : <div className="league-grid">{leagues.map((league, index) => <article className="league-card" key={`${league.name}-${index}`}><h2>{league.name}</h2>{league.season !== undefined && <p>{t.season}: {league.season}</p>}{league.sport && <p>{league.sport}</p>}{league.status && <p>{league.status}</p>}</article>)}</div>}</section>}<div className="actions session-actions"><button onClick={logout}>{t.logout}</button><button className="secondary" onClick={clear}>{t.clear}</button></div></main>;
  const message = status === 'connecting' ? t.connecting : status === 'cancelled' ? t.cancelled : status === 'timeout' ? t.timeout : t.idle;
  return <main className="shell"><div className="top"><LanguageSelector value={language} onChange={setLanguage} label={t.language}/></div><div className="brand" aria-hidden="true">E</div><h1>ESPN Fantasy AI</h1><p role="status">{message}</p>{discoveryActive && <DiscoveryPanel language={language} ended={discoveryEnded} onEnd={endDiscovery}/>}<button className="connect" disabled={status === 'connecting'} onClick={login}>{t.connect}</button>{status === 'connecting' && !discoveryActive && <button className="secondary" onClick={() => window.espnAuth.cancel()}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</button>}<button className="help" onClick={() => setHelp(!help)}>{t.help}</button>{help && <p className="help-text">{t.helpText}</p>}</main>;
}

