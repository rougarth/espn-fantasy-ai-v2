import type { Language } from '../i18n/translations';
export function LanguageSelector({ value, onChange, label }: { value: Language; onChange: (language: Language) => void; label: string }) {
  return <label className="language">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as Language)}><option value="pt">Português</option><option value="en">English</option></select></label>;
}

