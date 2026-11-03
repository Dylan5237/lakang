import { useMemo, useState } from 'react';
import { findHits, highlight, norm, snippet } from '../lib/reading';
import { hrefs } from '../lib/router';
import type { Archive } from '../types';
import { Sheet } from './Sheet';

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function Marked({ text, query }: { text: string; query: string }) {
  return <>{highlight(text, query).map((p, i) => p.match ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>)}</>;
}

/** Search across every case: dialogue turns first, then note cards. */
export function SearchAllButton({ archive }: { archive: Archive }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const query = q.trim();
  const results = useMemo(() => {
    if (!query) return null;
    const talk: { href: string; where: string; text: string }[] = [];
    const notes: { href: string; where: string; text: string }[] = [];
    const tokens = norm(query).split(/\s+/);
    for (const c of archive.cases) {
      for (const h of findHits(c.sections, query)) {
        const s = c.sections.find((x) => x.id === h.sectionId)!;
        talk.push({ href: hrefs.talk(c.id, s.id), where: `${c.date} ${c.label} · ${s.title}`, text: snippet(s.turns[h.index].text, query) });
      }
      for (const g of c.groups) for (const card of g.cards) {
        const text = plain(card.html);
        if (tokens.every((t) => norm(text).includes(t))) notes.push({ href: hrefs.notes(c.id), where: `${c.date} ${c.label} · 要点：${card.tag || g.title}`, text: snippet(text, query) });
      }
    }
    return { talk, notes };
  }, [query, archive]);
  const all = results ? [...results.talk, ...results.notes] : [];
  return <>
    <button type="button" className="tool icon" aria-label="搜索全部" onClick={() => setOpen(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
    </button>
    <Sheet open={open} title="搜索全部案例" onClose={() => setOpen(false)} testId="global-search">
      <input className="gs-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="在对话与要点中搜索" aria-label="搜索全部案例" autoFocus data-testid="global-search-input" />
      {results && <p className="muted gs-count" data-testid="global-search-count">{all.length ? `共 ${all.length} 处` : '无结果'}</p>}
      {all.length > 0 && <div className="gs-results" data-testid="global-search-results">
        {all.slice(0, 40).map((r, i) => (
          <a key={i} className="hit" href={r.href} onClick={() => setOpen(false)}>
            <span className="hit-where">{r.where}</span>
            <span className="hit-text"><Marked text={r.text} query={query} /></span>
          </a>
        ))}
        {all.length > 40 && <p className="hint">仅显示前 40 处，可换更具体的词。</p>}
      </div>}
    </Sheet>
  </>;
}
