import { useEffect, useState } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { translations, type Language } from './i18n/translations';

type Status = 'idle' | 'connecting' | 'connected' | 'cancelled' | 'timeout';
export default function App() {
  const [language, setLanguage] = useState<Language>('pt');
  const [status, setStatus] = useState<Status>('idle');
  const [help, setHelp] = useState(false);
  const t = translations[language];
  useEffect(() => { void window.espnAuth.status().then((ok) => setStatus(ok ? 'connected' : 'idle')); }, []);
  const login = async () => { setStatus('connecting'); const result = await window.espnAuth.login(); setStatus(result === 'authenticated' ? 'connected' : result); };
  const logout = async () => { await window.espnAuth.logout(); setStatus('idle'); };
  const clear = async () => { await window.espnAuth.clear(); setStatus('idle'); };
  if (status === 'connected') return <main className="shell connected"><h1>ESPN Fantasy AI</h1><p role="status">{t.connected}</p><div className="actions"><button onClick={logout}>{t.logout}</button><button className="secondary" onClick={clear}>{t.clear}</button></div></main>;
  const message = status === 'connecting' ? t.connecting : status === 'cancelled' ? t.cancelled : status === 'timeout' ? t.timeout : t.idle;
  return <main className="shell"><div className="top"><LanguageSelector value={language} onChange={setLanguage} label={t.language}/></div><div className="brand" aria-hidden="true">E</div><h1>ESPN Fantasy AI</h1><p role="status">{message}</p><button className="connect" disabled={status === 'connecting'} onClick={login}>{t.connect}</button>{status === 'connecting' && <button className="secondary" onClick={() => window.espnAuth.cancel()}>{language === 'pt' ? 'Cancelar' : 'Cancel'}</button>}<button className="help" onClick={() => setHelp(!help)}>{t.help}</button>{help && <p className="help-text">{t.helpText}</p>}</main>;
}

