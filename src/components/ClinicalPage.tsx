import { useState } from 'react';

// The record never ships with the site or the repo: the server only returns it when the header carries the key.
// Not cached by the service worker (non-navigation fetch) and fetched with no-store.
const URL_PATH = 'private/clinical.html';
const KEY = 'lakang:clinical-key';
const saved = () => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } };

async function load(key: string): Promise<{ html?: string; error?: string }> {
  try {
    const res = await fetch(URL_PATH, { headers: { 'X-Lakang-Key': key }, cache: 'no-store' });
    if (res.status === 403) return { error: '密码不对。' };
    if (!res.ok) return { error: '记录暂不可用。' };
    return { html: await res.text() };
  } catch {
    return { error: '需要联网才能查看。' };
  }
}

export function ClinicalPage() {
  const [key, setKey] = useState(saved);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    const r = await load(key);
    setBusy(false);
    if (r.html) { setHtml(r.html); try { sessionStorage.setItem(KEY, key); } catch { /* private mode */ } }
    else setError(r.error!);
  };
  const lock = () => { setHtml(null); setKey(''); try { sessionStorage.removeItem(KEY); } catch { /* private mode */ } };
  if (html) return <main className="page clinical" data-testid="clinical">
    <header className="page-head clinical-head"><h1>临床演示记录</h1><button type="button" className="btn" onClick={lock}>锁定</button></header>
    <iframe className="clinical-frame" title="临床演示记录" sandbox="allow-scripts" srcDoc={html} data-testid="clinical-frame" />
  </main>;
  return <main className="page clinical" data-testid="clinical">
    <header className="page-head"><h1>临床演示记录</h1><p className="muted">私人资料，需要密码，只在联网时从服务器读取，不存入离线缓存或备份。</p></header>
    <form className="panel" onSubmit={(e) => void submit(e)}>
      <label className="field"><span>访问密码</span><input type="password" inputMode="numeric" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} data-testid="clinical-key" /></label>
      <div className="btn-row"><button type="submit" className="btn primary" disabled={!key || busy}>{busy ? '读取中…' : '查看'}</button></div>
      {error && <p className="warn" role="alert" data-testid="clinical-error">{error}</p>}
    </form>
  </main>;
}
