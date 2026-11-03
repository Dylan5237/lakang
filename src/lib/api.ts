import type { Archive } from '../types';

// The record never ships with the site or the repo: the server returns it only when the header carries the key.
const URL_PATH = 'private/clinical.json';
const KEY = 'lakang:key';

export type LoadResult = { ok: true; data: Archive } | { ok: false; error: 'denied' | 'missing' | 'offline' | 'invalid' };

export async function loadArchive(key: string): Promise<LoadResult> {
  let res: Response;
  try { res = await fetch(URL_PATH, { headers: { 'X-Lakang-Key': key }, cache: 'no-store' }); }
  catch { return { ok: false, error: 'offline' }; }
  if (res.status === 403) return { ok: false, error: 'denied' };
  if (!res.ok) return { ok: false, error: 'missing' };
  try {
    const data = await res.json() as Archive;
    return Array.isArray(data?.cases) ? { ok: true, data } : { ok: false, error: 'invalid' };
  } catch { return { ok: false, error: 'invalid' }; }
}

export const ERRORS: Record<Exclude<LoadResult, { ok: true }>['error'], string> = {
  denied: '密码不对。', missing: '记录暂不可用。', offline: '需要联网才能查看。', invalid: '记录格式有误。',
};

// Session by default; "remember" keeps the key on this device only.
export const savedKey = (): string => {
  try { return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) ?? ''; } catch { return ''; }
};
export function saveKey(key: string, remember: boolean): void {
  try { sessionStorage.setItem(KEY, key); if (remember) localStorage.setItem(KEY, key); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
export function clearKey(): void {
  try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
