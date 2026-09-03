import { useState } from 'react'
import { useI18n, type Lang } from './i18n'

const FLAGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'fr', flag: '🇫🇷', label: 'Français' },
  { lang: 'en', flag: '🇬🇧', label: 'English' },
]

export function LangFlags() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const active = FLAGS.find((candidate) => candidate.lang === lang) ?? FLAGS[0]
  return (
    <div className="lang-switch">
      <button
        type="button"
        className="icon-fab lang-flag"
        aria-label={active.label}
        title={active.label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >{active.flag}</button>
      {open && (
        <>
          <div className="lang-backdrop" onClick={() => setOpen(false)} />
          <div className="lang-menu" role="listbox" aria-label="Language">
            {FLAGS.map(({ lang: candidate, flag, label }) => (
              <button
                key={candidate}
                type="button"
                role="option"
                aria-selected={candidate === lang}
                className={candidate === lang ? 'lang-option active' : 'lang-option'}
                onClick={() => { setLang(candidate); setOpen(false) }}
              >
                <span className="lang-option-flag" aria-hidden="true">{flag}</span>
                <span>{label}</span>
                {candidate === lang && <span className="lang-option-check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
