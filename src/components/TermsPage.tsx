import { useState } from 'react';
import { norm } from '../lib/reading';
import { cardsByTerm, sourceById, termById, terms } from '../lib/study';
import { hrefs } from '../lib/router';
import { LinkedText } from './LinkedText';
import { SearchAllButton } from './GlobalSearch';
import { SettingsButton } from './Settings';

export function TermsPage({ termId }: { termId?: string }) {
  const term = termId ? termById.get(termId) : undefined;
  if (termId && !term) return <main className="page" data-testid="terms"><h1>没有这个术语</h1><a className="btn" href={hrefs.terms()}>返回词典</a></main>;
  if (term) return <TermDetail key={term.id} id={term.id} />;
  return <TermsList />;
}

export function TermsBrowser({ compact = false, testId = 'terms' }: { compact?: boolean; testId?: 'terms' | 'me' }) {
  const [q, setQ] = useState('');
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  const hit = (t: (typeof terms)[number]) => !tokens.length || tokens.every((k) => norm(`${t.zh} ${t.original} ${t.brief}`).includes(k));
  const list = terms.filter(hit);
  return <>
    <input className="gs-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="筛选术语" aria-label="筛选术语"
      data-testid={testId === 'me' ? 'me-terms-filter' : 'terms-filter'} />
    <ul className={`term-list ${compact ? 'compact' : ''}`}>{list.map((t) => <li key={t.id}>
      <a href={hrefs.terms(t.id)}><strong>{t.zh}</strong> <span className="orig">{t.original}</span><span className="term-brief">{t.brief}</span></a>
    </li>)}</ul>
    {!list.length && <p className="muted">没有匹配的术语。</p>}
  </>;
}

function TermsList() {
  return <main className="page terms" data-testid="terms">
    <header className="page-head"><div className="page-tools"><SearchAllButton archive={null} /><SettingsButton /></div>
      <h1>术语词典</h1><p className="muted">{terms.length} 条 · 拉康派通行用法，注明出处与案例回链</p></header>
    <TermsBrowser />
  </main>;
}

function TermDetail({ id }: { id: string }) {
  const t = termById.get(id)!;
  const used = cardsByTerm(id);
  return <main className="page terms detail" data-testid="term-detail">
    <header className="page-head"><div className="page-tools"><SearchAllButton archive={null} /><SettingsButton /></div>
      <a className="btn-link" href={hrefs.terms()}>返回词典</a>
      <h1>{t.zh} <span className="orig">{t.original}</span></h1>
    </header>
    <p className="lead"><LinkedText text={t.brief} /></p>
    {t.detail && <p className="para"><LinkedText text={t.detail} /></p>}
    {t.caseLinks && t.caseLinks.length > 0 && <section className="panel"><h2>在案例中出现</h2>
      <ul className="case-links">{t.caseLinks.map((l, i) => <li key={i}>
        <a href={hrefs.talk(l.case, l.section)}>{l.note}</a>
      </li>)}</ul>
      <p className="hint">链接进入临床演示记录，需要访问密码。</p>
    </section>}
    {t.related && t.related.length > 0 && <section className="panel"><h2>相关术语</h2>
      <div className="btn-row">{t.related.map((r) => termById.get(r) && <a key={r} className="btn" href={hrefs.terms(r)}>{termById.get(r)!.zh}</a>)}</div>
    </section>}
    {used.length > 0 && <section className="panel"><h2>讲解它的卡片</h2>
      <ul className="case-links">{used.map((c) => <li key={c.id}><a href={hrefs.cards(c.id)}>{c.title}</a></li>)}</ul>
    </section>}
    {t.sourceIds.length > 0 && <section className="panel"><h2>出处</h2>
      <ul className="case-links">{t.sourceIds.map((s) => { const src = sourceById.get(s); return src && <li key={s}><a href={src.url} target="_blank" rel="noopener noreferrer">{s} · {src.title}</a></li>; })}</ul>
    </section>}
  </main>;
}
