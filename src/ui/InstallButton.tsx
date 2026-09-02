import { useEffect, useState } from 'react'
import { useI18n } from './i18n'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function InstallButton() {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(() => isStandalone())

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = () => setStandalone(isStandalone())
    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      if (!isStandalone()) setPrompt(event)
    }
    const onInstalled = () => {
      setPrompt(null)
      setStandalone(true)
    }

    media.addEventListener('change', onDisplayModeChange)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      media.removeEventListener('change', onDisplayModeChange)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (standalone || !prompt) return null

  async function install() {
    const installPrompt = prompt
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setPrompt(null)
  }

  return <button className="install-button" type="button" onClick={install}>{t('install')}</button>
}
