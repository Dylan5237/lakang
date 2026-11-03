import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { NOTE_MAX, readNotes, saveNote } from '../lib/notes';
import { findHits, highlight, savePosition } from '../lib/reading';
import { hrefs } from '../lib/router';
import type { Case, Section, Turn } from '../types';
import { Sheet } from './Sheet';

const initial = (who: string) => who.replace(/（.*$/, '').trim().charAt(0) || '·';

const Bubble = memo(function Bubble({ turn, query, hit, current }: { turn: Turn; query: string; hit: number | null; current: boolean }) {
  if (turn.role === 'note') return <p className={`turn-note ${current ? 'current' : ''}`} data-hit={hit ?? undefined}>{parts(turn.text, query)}</p>;
  return <div className={`turn ${turn.role} ${current ? 'current' : ''}`} data-hit={hit ?? undefined}>
    <span className="avatar" aria-hidden="true">{initial(turn.who)}</span>
    <div className="bubble"><span className="who">{turn.who}</span><p>{parts(turn.text, query)}</p></div>
  </div>;
});
function parts(text: string, query: string) {
  return highlight(text, query).map((p, i) => p.match ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>);
}

export function Talk({ c, sectionId }: { c: Case; sectionId?: string }) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [hitIndex, setHitIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [notes, setNotes] = useState(readNotes);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [active, setActive] = useState(sectionId ?? c.sections[0]?.id);
  const scroller = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => findHits(c.sections, query), [c, query]);
  const hitAt = useMemo(() => new Map(hits.map((h, i) => [`${h.sectionId}:${h.index}`, i])), [hits]);
  const activeIdx = c.sections.findIndex((s) => s.id === active);

  const jumpTo = (id: string, smooth = true) => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 4, behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => { if (sectionId) jumpTo(sectionId, false); }, [c.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track the section at the top of the reading pane; remember it per case.
  useEffect(() => {
    const root = scroller.current; if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        const id = (e.target as HTMLElement).dataset.sectionId!;
        setActive(id); savePosition(c.id, id);
        history.replaceState(null, '', hrefs.talk(c.id, id));
      }
    }, { root, rootMargin: '0px 0px -85% 0px' });
    root.querySelectorAll('[data-section-id]').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [c]);

  useEffect(() => { setHitIndex(0); }, [query]);
  useEffect(() => {
    if (!hits.length) return;
    const el = scroller.current?.querySelector<HTMLElement>(`[data-hit="${hitIndex}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [hitIndex, hits]);

  const firstDiscussion = c.sections.find((s) => s.part === 'discussion')?.id;
  const openNote = (id: string) => { setNoteFor(id); setDraft(notes[id] ?? ''); };
  const noteSection = noteFor ? c.sections.find((s) => s.id === noteFor) : undefined;

  return <>
    <div className="toolbar">
      <button type="button" className="tool" onClick={() => setTocOpen(true)} data-testid="open-toc">
        <span className="tool-label">目录</span><span className="tool-sub">{activeIdx + 1}/{c.sections.length}</span>
      </button>
      <button type="button" className={`tool icon ${searchOpen ? 'on' : ''}`} aria-label="搜索" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(''); }}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
      </button>
    </div>
    {searchOpen && <div className="searchbar">
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="在本案例中搜索" aria-label="在本案例中搜索" autoFocus data-testid="search" />
      <span className="search-count" data-testid="search-count">{query.trim() ? (hits.length ? `${hitIndex + 1}/${hits.length}` : '无结果') : ''}</span>
      <button type="button" className="tool icon" aria-label="上一处" disabled={!hits.length} onClick={() => setHitIndex((hitIndex - 1 + hits.length) % hits.length)}>↑</button>
      <button type="button" className="tool icon" aria-label="下一处" disabled={!hits.length} onClick={() => setHitIndex((hitIndex + 1) % hits.length)}>↓</button>
    </div>}
    <div className="progress" aria-hidden="true"><span style={{ width: `${((activeIdx + 1) / c.sections.length) * 100}%` }} /></div>
    <div className="talk" ref={scroller} data-testid="talk">
      {c.sections.map((s, si) => <SectionView key={s.id} s={s} index={si} c={c} query={query} hitAt={hitAt} currentHit={hits[hitIndex]}
        divider={s.id === firstDiscussion ? c.discussionLabel ?? '讨论' : null} onNext={(id) => jumpTo(id)} hasNote={Boolean(notes[s.id])} onNote={openNote} />)}
    </div>
    <Sheet open={tocOpen} title="目录" onClose={() => setTocOpen(false)} testId="toc">
      <ol className="toc">{c.sections.map((s, i) => <li key={s.id}>
        {s.id === firstDiscussion && <p className="toc-part">{c.discussionLabel ?? '讨论'}</p>}
        {i === 0 && <p className="toc-part">访谈</p>}
        <button type="button" className={s.id === active ? 'on' : ''} aria-current={s.id === active ? 'true' : undefined}
          onClick={() => { setTocOpen(false); requestAnimationFrame(() => jumpTo(s.id, false)); }}>
          <span className="toc-title">{s.title}</span><span className="toc-time">{s.time} · {s.turns.length} 段</span>
        </button></li>)}</ol>
    </Sheet>
    <Sheet open={noteFor !== null} title={noteSection ? `笔记 · ${noteSection.title}` : '笔记'} onClose={() => setNoteFor(null)} testId="note-sheet">
      <textarea className="note-area" data-testid="note-text" value={draft} maxLength={NOTE_MAX} aria-label="笔记内容"
        placeholder="写下自己的理解、问题或联想…" onChange={(e) => setDraft(e.target.value)} />
      <p className="hint">{draft.length}/{NOTE_MAX} · 只保存在这台设备上，不上传。</p>
      <div className="sheet-foot">
        <button type="button" className="btn primary" data-testid="note-save" onClick={() => { if (noteFor) saveNote(noteFor, draft); setNotes(readNotes()); setNoteFor(null); }}>保存</button>
        {noteFor && notes[noteFor] && <button type="button" className="btn danger" onClick={() => { saveNote(noteFor, ''); setNotes(readNotes()); setNoteFor(null); }}>删除</button>}
      </div>
    </Sheet>
  </>;
}

function SectionView({ s, index, c, query, hitAt, currentHit, divider, onNext, hasNote, onNote }: {
  s: Section; index: number; c: Case; query: string; hitAt: Map<string, number>;
  currentHit?: { sectionId: string; index: number }; divider: string | null; onNext: (id: string) => void;
  hasNote: boolean; onNote: (id: string) => void;
}) {
  const next = c.sections[index + 1];
  return <section className="sec" data-section-id={s.id}>
    {divider && <div className="part-divider"><span>{divider}</span></div>}
    <header className="sec-head">
      <h2>{s.title}</h2>
      <span className="sec-time">{s.time}</span>
      <button type="button" className={`note-btn ${hasNote ? 'has' : ''}`} aria-label="写笔记" aria-pressed={hasNote} onClick={() => onNote(s.id)}>笔记</button>
    </header>
    {s.turns.map((t, i) => <Bubble key={i} turn={t} query={query} hit={hitAt.get(`${s.id}:${i}`) ?? null}
      current={currentHit?.sectionId === s.id && currentHit.index === i} />)}
    {next && <button type="button" className="next-sec" onClick={() => onNext(next.id)}>下一节 · {next.title}</button>}
  </section>;
}

