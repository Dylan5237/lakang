import { useMemo, useState } from 'react';
import { findHits, highlight, norm, snippet } from '../lib/reading';
import { hrefs } from '../lib/router';
import { studyCards, terms } from '../lib/study';
import type { Archive } from '../types';
import { Sheet } from './Sheet';

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function Marked({ text, query }: { text: string; query: string }) {
  return <>{highlight(text, query).map((p, i) => p.match ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>)}</>;
}

interface Hit { href: string; where: string; text: string }
interface Group { label: string; hits: Hit[] }

/** Search across terms, study cards and (when unlocked) the clinical cases. */
export function SearchAllButton({ archive }: { archive: Archive | null }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const query = q.trim();
  const groups = useMemo<Group[]>(() => {
    if (!query) return [];
    const tokens = norm(query).split(/\s+/);
    const every = (text: string) => tokens.every((t) => norm(text).includes(t));
    const out: Group[] = [];
    const termHits: Hit[] = terms.filter((t) => every(`${t.zh} ${t.original} ${t.brief} ${t.detail ?? ''}`))
      .map((t) => ({ href: hrefs.terms(t.id), where: `术语 · ${t.zh} ${t.original}`, text: snippet(t.brief, query) }));
    if (termHits.length) out.push({ label: '术语', hits: termHits });
    const cardHits: Hit[] = studyCards.filter((c) => every(`${c.title} ${c.topic} ${c.body} ${c.takeaway} ${c.detail.join(' ')}`))
      .map((c) => ({ href: hrefs.cards(c.id), where: `概念卡 · ${c.stageLabel}/${c.topic}`, text: snippet(c.body, query) }));
    if (cardHits.length) out.push({ label: '概念卡', hits: cardHits });
    if (archive) {
      const talk: Hit[] = [];
      const notes: Hit[] = [];
      for (const c of archive.cases) {
        for (const h of findHits(c.sections, query)) {
          const s = c.sections.find((x) => x.id === h.sectionId)!;
          talk.push({ href: hrefs.talk(c.id, s.id), where: `${c.date} ${c.label} · ${s.title}`, text: snippet(s.turns[h.index].text, query) });
        }
        for (const g of c.groups) for (const card of g.cards) {
          const text = plain(card.html);
          if (every(text)) notes.push({ href: hrefs.notes(c.id), where: `${c.date} ${c.label} · 要点：${card.tag || g.title}`, text: snippet(text, query) });
        }
      }
      if (talk.length) out.push({ label: '案例对话', hits: talk });
      if (notes.length) out.push({ label: '案例要点', hits: notes });
    }
    return out;
  }, [query, archive]);
  const total = groups.reduce((n, g) => n + g.hits.length, 0);
  return <>
    <button type="button" className="tool icon" aria-label="搜索全部" onClick={() => setOpen(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
    </button>
    <Sheet open={open} title="搜索" onClose={() => setOpen(false)} testId="global-search">
      <input className="gs-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="术语、概念卡、案例" aria-label="搜索全部内容" autoFocus data-testid="global-search-input" />
      {groups.length > 0 && <p className="muted gs-count" data-testid="global-search-count">{total ? `共 ${total} 处` : '无结果'}</p>}
      {groups.map((g) => <section key={g.label} className="gs-group">
        <h3>{g.label} · {g.hits.length}</h3>
        <div className="gs-results" data-testid="global-search-results">
          {g.hits.slice(0, 20).map((r, i) => (
            <a key={i} className="hit" href={r.href} onClick={() => setOpen(false)}>
              <span className="hit-where">{r.where}</span>
              <span className="hit-text"><Marked text={r.text} query={query} /></span>
            </a>
          ))}
        </div>
      </section>)}
      {groups.length > 0 && total > 60 && <p className="hint">每组仅显示前 20 处，可换更具体的词。</p>}
    </Sheet>
  </>;
}
