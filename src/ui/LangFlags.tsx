import { useI18n, type Lang } from './i18n'

const FLAGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: 'fr', flag: '🇫🇷', label: 'Français' },
  { lang: 'en', flag: '🇬🇧', label: 'English' },
]

export function LangFlags() {
  const { lang, setLang } = useI18n()
  return (
    <div className="lang-flags" role="group" aria-label="Language">
      {FLAGS.map(({ lang: candidate, flag, label }) => (
        <button
          key={candidate}
          type="button"
          className={candidate === lang ? 'icon-fab lang-flag active' : 'icon-fab lang-flag'}
          aria-pressed={candidate === lang}
          aria-label={label}
          title={label}
          onClick={() => setLang(candidate)}
        >{flag}</button>
      ))}
    </div>
  )
}
