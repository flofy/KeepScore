export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = (event: BeforeInstallPromptEvent | null) => void

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<Listener>()

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function notify() {
  listeners.forEach((listener) => listener(deferredPrompt))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    if (isStandalone()) return
    deferredPrompt = event
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function getInstallPrompt() {
  return deferredPrompt
}

export function subscribeToInstallPrompt(listener: Listener) {
  listeners.add(listener)
  listener(deferredPrompt)
  return () => listeners.delete(listener)
}

export function clearInstallPrompt() {
  deferredPrompt = null
  notify()
}
