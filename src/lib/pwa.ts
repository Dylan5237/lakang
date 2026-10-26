import { useSyncExternalStore } from 'react';

const READY_KEY = 'lakang:offline-ready';

interface PwaState {
  offlineReady: boolean;
  needRefresh: boolean;
}

let pwa: PwaState = { offlineReady: false, needRefresh: false };
const listeners = new Set<() => void>();
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

function set(patch: Partial<PwaState>) {
  pwa = { ...pwa, ...patch };
  listeners.forEach((l) => l());
}

export async function initPwa(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    if (localStorage.getItem(READY_KEY) === '1' && navigator.serviceWorker.controller) set({ offlineReady: true });
  } catch {
    /* 存储不可用时只在本次会话内显示 */
  }
  const { registerSW } = await import('virtual:pwa-register');
  updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      try {
        localStorage.setItem(READY_KEY, '1');
      } catch {
        /* ignore */
      }
      set({ offlineReady: true });
    },
    onNeedRefresh() {
      set({ needRefresh: true });
    },
  });
}

export const applyUpdate = () => updateSW?.(true);

export function usePwa(): PwaState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => pwa,
    () => pwa,
  );
}
