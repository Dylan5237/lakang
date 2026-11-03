import { useEffect, useState } from 'react';
import { hrefs, navigate } from '../lib/router';
import { cardById, cardOrder, readProgress, sourceById, studyCards, termById, toggleFavorite, visitCard } from '../lib/study';
import { LinkedText } from './LinkedText';
import { Sheet } from './Sheet';

export function CardsPage({ cardId }: { cardId?: string }) {
  const [progress, setProgress] = useState(readProgress);
  const [tocOpen, setTocOpen] = useState(false);
  const id = cardId && cardById.has(cardId) ? cardId : cardId ? cardOrder[0] : (progress.position && cardById.has(progress.position) ? progress.position : cardOrder[0]);
  const card = cardById.get(id)!;
  const index = cardOrder.indexOf(id);

  useEffect(() => { setProgress(visitCard(id)); }, [id]);

  const go = (dir: 1 | -1) => {
    const next = cardOrder[Math.min(cardOrder.length - 1, Math.max(0, index + dir))];
    if (next !== id) navigate(hrefs.cards(next));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'j' || e.key === 'ArrowRight') go(1);
      if (e.key === 'k' || e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const fav = progress.favorites.includes(id);
  const readCount = progress.read.filter((x) => cardById.has(x)).length;
  return <main className="page cards" data-testid="cards">
    <header className="appbar">
      <a className="back" href={hrefs.home()} aria-label="返回学习首页">‹</a>
      <div className="appbar-title"><h1>概念卡</h1><p>已读 {readCount}/{studyCards.length} · {index + 1}/{cardOrder.length}</p></div>
      <button type="button" className={`tool icon ${fav ? 'on' : ''}`} aria-label={fav ? '取消收藏' : '收藏'} aria-pressed={fav}
        onClick={() => setProgress(toggleFavorite(id))} data-testid="card-fav">{fav ? '★' : '☆'}</button>
      <button type="button" className="tool" onClick={() => setTocOpen(true)} data-testid="open-card-toc"><span className="tool-label">目录</span></button>
    </header>
    <div className="progress" aria-hidden="true"><span style={{ width: `${((index + 1) / cardOrder.length) * 100}%` }} /></div>
    <div className="card-page" data-testid="card-page" data-card-id={id}>
      <p className="eyebrow">{card.stageLabel} · {card.topic}</p>
      <h1>{card.title}</h1>
      {card.body.split('\n').map((p, i) => <p key={i} className="para"><LinkedText text={p} /></p>)}
      <p className="takeaway"><LinkedText text={card.takeaway} /></p>
      <details className="card-more">
        <summary>展开读</summary>
        {card.detail.map((d, i) => <p key={i} className="para"><LinkedText text={d} /></p>)}
        {card.question && <p className="qa"><strong>问</strong> <LinkedText text={card.question} /></p>}
        {card.action && <p className="qa"><strong>练</strong> <LinkedText text={card.action} /></p>}
        {card.termIds.length > 0 && <p className="chips-row">{card.termIds.map((t) => termById.get(t) && <a key={t} className="btn" href={hrefs.terms(t)}>{termById.get(t)!.zh}</a>)}</p>}
        {card.relatedCardIds.length > 0 && <p className="chips-row">{card.relatedCardIds.map((r) => <a key={r} className="btn" href={hrefs.cards(r)}>{cardById.get(r)!.title}</a>)}</p>}
        {card.sourceIds.length > 0 && <p className="sources">{card.sourceIds.map((s, i) => { const src = sourceById.get(s); return <span key={s}>{i > 0 && '；'}{src && <a href={src.url} target="_blank" rel="noopener noreferrer">{s} 出处</a>}{card.locators[s] ? `：${card.locators[s]}` : ''}</span>; })}</p>}
      </details>
    </div>
    <nav className="card-nav" aria-label="翻卡">
      <button type="button" className="btn" disabled={index === 0} onClick={() => go(-1)}>上一张</button>
      <button type="button" className="btn primary" disabled={index === cardOrder.length - 1} onClick={() => go(1)}>下一张</button>
    </nav>
    <Sheet open={tocOpen} title="概念卡目录" onClose={() => setTocOpen(false)} testId="card-toc">
      <ol className="toc">{(() => {
        const read = new Set(progress.read);
        return Object.values(studyCards.reduce<Record<string, { label: string; items: { id: string; title: string }[] }>>((acc, c) => {
          (acc[c.stageLabel] ??= { label: c.stageLabel, items: [] }).items.push({ id: c.id, title: c.title });
          return acc;
        }, {})).flatMap((g) => [<li key={g.label} className="toc-group">{g.label} · {g.items.length}</li>,
          ...g.items.map((it) => <li key={it.id}><button type="button" className={it.id === id ? 'on' : ''} onClick={() => { setTocOpen(false); navigate(hrefs.cards(it.id)); }}>
            <span className="toc-title">{it.title}</span>{read.has(it.id) && <span className="muted"> · 已读</span>}
          </button></li>)]);
      })()}</ol>
    </Sheet>
  </main>;
}
