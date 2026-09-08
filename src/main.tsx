import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './ui/responsive.css'
import { App } from './app/App'
import { AppProviders } from './app/providers'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('KeepScore service worker registration failed.', error)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
