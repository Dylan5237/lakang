import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// The previous version installed a service worker under this scope; retire it so stale pages are not served.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
  if ('caches' in window) void caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
