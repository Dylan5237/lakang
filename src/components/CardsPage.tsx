import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GOAL, readHabit } from '../lib/habit';
import { hrefs } from '../lib/router';
import { cardById, cardOrder, pathById, readProgress, sourceById, studyCards, termById, toggleFavorite, visitCard } from '../lib/study';
import type { StudyCard } from '../types';
import { AskAIButton } from './AskAI';
import { Figure } from './Figure';
import { Fold } from './Fold';
import { LinkedText } from './LinkedText';
import { Sheet } from './Sheet';

/** Swipe feed: full-height snap cards, the scroller is the deck. */
export function CardsPage({ cardId }: { cardId?: string }) {
  const [progress, setProgress] = useState(readProgress);
  const [tocOpen, setTocOpen] = useState(false);
  const [active, setActive] = useState(() => {
    const start = cardId && cardById.has(cardId) ? cardId : (readProgress().position && cardById.has(readProgress().position!) ? readProgress().position : cardOrder[0]);
    return start!;
  });
  const scroller = useRef<HTMLDivElement>(null);
  const index = cardOrder.indexOf(active);
  const readCount = progress.read.filter((id) => cardById.has(id)).length;

  const jumpTo = (id: string, smooth = true) => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
    el?.scrollIntoView({ behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto', block: 'start' });
  };
  const go = (dir: 1 | -1) => {
    const next = cardOrder[Math.min(cardOrder.length - 1, Math.max(0, index + dir))];
    if (next !== active) jumpTo(next);
  };

  // Deep link / module entry: land on the requested card (or the saved position) and sync the hash once.
  const firstRun = useRef(true);
  useEffect(() => {
    const target = cardId && cardById.has(cardId) ? cardId : active;
    jumpTo(target, false);
    history.replaceState(null, '', hrefs.cards(target));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    firstRun.current = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Later hash-driven navigations (links from other pages, K-refs) move the deck;
  // hash changes the observer itself emits (selfId) must not re-trigger the jump.
  const selfId = useRef<string | null>(null);
  useEffect(() => {
    if (firstRun.current || !cardId || !cardById.has(cardId) || cardId === active || cardId === selfId.current) return;
    jumpTo(cardId, false); // long jumps: instant, scroll-snap cancels long smooth scrolls
  }, [cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // The reading band (45% of the viewport height) decides which card is active during scrolling;
  // a plain scroll handler is deterministic where an IntersectionObserver can flip-flop between neighbours.
  const activeRef = useRef(active); activeRef.current = active;
  useEffect(() => {
    const root = scroller.current; if (!root) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = root.scrollTop + root.clientHeight * 0.45;
      let current: string | null = null;
      for (const el of root.querySelectorAll<HTMLElement>('[data-card-id]')) {
        if (el.offsetTop <= y) current = el.dataset.cardId!; else break;
      }
      if (!current || current === activeRef.current) return;
      selfId.current = current;
      setActive(current);
      setProgress(visitCard(current));
      history.replaceState(null, '', hrefs.cards(current));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    root.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => { root.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { setProgress(visitCard(active)); }, [active]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowRight') go(1);
      if (e.key === 'k' || e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const fav = progress.favorites.includes(active);
  const byStage = useMemo(() => Object.values(studyCards.reduce<Record<string, { label: string; items: { id: string; title: string }[] }>>((acc, c) => {
    (acc[c.stageLabel] ??= { label: c.stageLabel, items: [] }).items.push({ id: c.id, title: c.title });
    return acc;
  }, {})), [studyCards]);
  const read = new Set(progress.read);
  const habit = readHabit();

  return <main className="deck" data-testid="cards">
    <header className="appbar deck-bar">
      <a className="back" href={hrefs.home()} aria-label="返回学习首页">‹</a>
      <div className="appbar-title"><h1>概念卡</h1><p>已读 {readCount}/{studyCards.length} · {index + 1}/{cardOrder.length} · 上下滑动换卡</p></div>
      <button type="button" className={`tool icon card-fav ${fav ? 'on' : ''}`} aria-label={fav ? '取消收藏' : '收藏'} aria-pressed={fav}
        onClick={() => setProgress(toggleFavorite(active))} data-testid="card-fav"><svg viewBox="0 0 24 24" aria-hidden="true" style={fav ? { fill: "currentColor" } : undefined}><path d="m12 4.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" /></svg></button>
      <button type="button" className="tool" onClick={() => setTocOpen(true)} data-testid="open-card-toc"><span className="tool-label">目录</span></button>
      <AskAIButton />
    </header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((index + 1) / cardOrder.length) * 100}%` }} /></div>
    <div className="feed" ref={scroller} data-testid="feed">
      {cardOrder.map((id) => { const card = cardById.get(id)!; return <Card key={id} card={card} active={id === active} />; })}
      <section className="sCard end" data-end>
        <div className="card-inner">
          <h2 className="card-title">最后一张</h2>
          <p className="para">共 {studyCards.length} 张，已读 {readCount} 张。{habit.cardsToday >= DAILY_GOAL ? `今天读了 ${habit.cardsToday} 张，目标达成。` : `今天 ${habit.cardsToday}/${DAILY_GOAL} 张。`}</p>
          <div className="btn-row"><a className="btn" href={hrefs.cards(cardOrder[0])}>回到第一张</a><a className="btn primary" href="#/review">去闪卡复习</a></div>
        </div>
      </section>
    </div>
    <nav className="card-nav" aria-label="翻卡">
      <button type="button" className="btn" disabled={index === 0} onClick={() => go(-1)}>‹ 上一张</button>
      <button type="button" className="btn primary" disabled={index === cardOrder.length - 1} onClick={() => go(1)}>下一张 ›</button>
    </nav>
    <Sheet open={tocOpen} title="概念卡目录" onClose={() => setTocOpen(false)} testId="card-toc">
      <ol className="toc">{byStage.flatMap((g) => [<li key={g.label} className="toc-group">{g.label} · {g.items.length}</li>,
        ...g.items.map((it) => <li key={it.id}><button type="button" className={it.id === active ? 'on' : ''} onClick={() => { setTocOpen(false); requestAnimationFrame(() => jumpTo(it.id, false)); }}>
          <span className="toc-title">{it.title}</span>{read.has(it.id) && <span className="muted"> · 已读</span>}
        </button></li>)])}</ol>
    </Sheet>
  </main>;
}

function Card({ card, active }: { card: StudyCard; active: boolean }) {
  const path = card.pathId ? pathById.get(card.pathId) : undefined;
  const pos = path ? path.cardIds.indexOf(card.id) + 1 : 0;
  return <section className={`sCard ${active ? 'on' : ''}`} data-card-id={card.id} data-testid="card-page">
    <div className="card-inner">
      {path && <p className="path-tag"><a href={hrefs.paths(path.id)}>{path.title}</a> · {pos}/{path.cardIds.length}</p>}
      <p className="eyebrow"><span className={`stage-dot s-${card.stage}`} aria-hidden="true" />{card.stageLabel} · {card.topic}</p>
      <h2 className="card-title">{card.title}</h2>
      {card.body.split('\n').map((p, i) => <p key={i} className="para"><LinkedText text={p} /></p>)}
      <p className="takeaway"><LinkedText text={card.takeaway} /></p>
      {(card.question || card.action) && <aside className="think" aria-label="读完想一想">
        <h3>读完想一想</h3>
        {card.question && <p className="qa"><strong>问</strong> <LinkedText text={card.question} /></p>}
        {card.action && <p className="qa"><strong>练</strong> <LinkedText text={card.action} /></p>}
      </aside>}
      {card.figure && <Figure figure={card.figure} credit />}
      <Fold label="展开读" testId="card-more">
        {card.detail.map((d, i) => <p key={i} className="para"><LinkedText text={d} /></p>)}
        {card.termIds.length > 0 && <p className="chips-row">{card.termIds.map((t) => termById.get(t) && <a key={t} className="btn" href={hrefs.terms(t)}>{termById.get(t)!.zh}</a>)}</p>}
        {card.relatedCardIds.length > 0 && <p className="chips-row">{card.relatedCardIds.map((r) => <a key={r} className="btn" href={hrefs.cards(r)}>{cardById.get(r)!.title}</a>)}</p>}
        {card.sourceIds.length > 0 && <p className="sources">{card.sourceIds.map((s, i) => { const src = sourceById.get(s); return <span key={s}>{i > 0 && '；'}{src && <a href={src.url} target="_blank" rel="noopener noreferrer">{s} 出处</a>}{card.locators[s] ? `：${card.locators[s]}` : ''}</span>; })}</p>}
      </Fold>
      {path && <nav className="path-nav" aria-label="路径导航">
        {pos > 1 && <a href={hrefs.cards(path.cardIds[pos - 2])}>‹ 路径上一张</a>}
        <a href={hrefs.paths(path.id)}>路径目录</a>
        {pos < path.cardIds.length && <a href={hrefs.cards(path.cardIds[pos])}>路径下一张 ›</a>}
      </nav>}
    </div>
  </section>;
}
