import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applySettings, readSettings } from './lib/settings';
import '@fontsource/noto-serif-sc/500.css';
import '@fontsource/noto-serif-sc/600.css';
import './styles.css';

// Reading preferences persist across visits; apply before first paint.
applySettings(readSettings());

// The previous version installed a service worker under this scope; retire it so stale pages are not served.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
  if ('caches' in window) void caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
}

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>);
