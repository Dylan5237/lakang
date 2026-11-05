import { useEffect, useState } from 'react';
import { ERRORS, loadArchive, saveKey, savedKey } from '../lib/api';
import type { Archive } from '../types';
import { LogoMark } from './Logo';

export function LockScreen({ onOpen }: { onOpen: (a: Archive) => void }) {
  const [key, setKey] = useState(savedKey);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = async (k: string, rem: boolean, silent = false) => {
    setBusy(true); setError(null);
    const r = await loadArchive(k);
    setBusy(false);
    if (r.ok) { saveKey(k, rem); onOpen(r.data); } else if (!silent || r.error !== 'denied') setError(ERRORS[r.error]);
  };
  // A key saved earlier in this session (or remembered) opens without retyping.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const k = savedKey(); if (k) void open(k, localStorage.getItem('lakang:key') === k, true); }, []);
  return <main className="lock" data-testid="lock">
    <div className="lock-card">
      <LogoMark className="lock-mark" />
      <h1>拉康派临床演示</h1>
      <p className="muted">私人记录 · 需要访问密码</p>
      <form onSubmit={(e) => { e.preventDefault(); void open(key, remember); }}>
        <input className="lock-input" type="password" inputMode="numeric" autoComplete="current-password" aria-label="访问密码"
          placeholder="访问密码" value={key} onChange={(e) => setKey(e.target.value)} data-testid="key" autoFocus />
        <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />在这台设备上记住</label>
        <button className="btn primary block" type="submit" disabled={!key || busy}>{busy ? '读取中…' : '进入'}</button>
        <p className="lock-error" role="alert" data-testid="lock-error">{error}</p>
      </form>
      <p className="hint">记录只在联网时从服务器读取，不写入离线缓存。</p>
    </div>
  </main>;
}
