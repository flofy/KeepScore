import { useEffect, useState } from 'react'
import { useI18n } from './i18n'
import {
  clearInstallPrompt,
  getInstallPrompt,
  subscribeToInstallPrompt,
  type BeforeInstallPromptEvent,
} from './installPrompt'

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
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(() => getInstallPrompt())
  const [standalone, setStandalone] = useState(() => isStandalone())

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = () => setStandalone(isStandalone())
    const unsubscribe = subscribeToInstallPrompt(setPrompt)

    media.addEventListener('change', onDisplayModeChange)

    return () => {
      media.removeEventListener('change', onDisplayModeChange)
      unsubscribe()
    }
  }, [])

  if (standalone || !prompt) return null

  async function install() {
    const installPrompt = prompt
    if (!installPrompt) return

    await installPrompt.prompt()
    await installPrompt.userChoice
    clearInstallPrompt()
  }

  return <button className="install-button" type="button" onClick={install}>{t('install')}</button>
}
