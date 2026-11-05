import { useEffect, useMemo, useState } from 'react';
import { buildItems, dueCount, masteredCount, rate, readSched, sessionQueue, type ReviewItem } from '../lib/review';
import { markReview } from '../lib/habit';
import { hrefs } from '../lib/router';
import { AskAIButton } from './AskAI';
import { SettingsButton } from './Settings';

const RATINGS = [
  { q: 0 as const, label: '忘了', cls: 'again' },
  { q: 1 as const, label: '记得', cls: 'good' },
  { q: 2 as const, label: '很熟', cls: 'easy' },
];

export function Flashcards() {
  const items = useMemo(buildItems, []);
  const [sched, setSched] = useState(readSched);
  // Frozen at session start: re-deriving it after each rating would shift the queue under the index.
  const [queue] = useState(() => sessionQueue(items, sched));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ again: 0, good: 0, easy: 0 });
  const current: ReviewItem | undefined = queue[idx];

  useEffect(() => { setFlipped(false); }, [idx]);

  const answer = (q: 0 | 1 | 2) => {
    if (!current) return;
    setSched(rate(current.id, q));
    markReview();
    setTally((t) => ({ ...t, [q === 0 ? 'again' : q === 1 ? 'good' : 'easy']: t[q === 0 ? 'again' : q === 1 ? 'good' : 'easy'] + 1 }));
    setIdx((i) => i + 1);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!current) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && (e.key === '1' || e.key === '2' || e.key === '3')) answer(([0, 1, 2] as const)[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const done = !current;
  const due = dueCount(items, sched);
  const mastered = masteredCount(sched);
  return <main className="page review" data-testid="review">
    <header className="appbar">
      <a className="back" href={hrefs.home()} aria-label="返回学习首页">‹</a>
      <div className="appbar-title"><h1>闪卡复习</h1><p>{due} 张待复习 · {mastered} 张已熟练</p></div>
      <AskAIButton />
      <SettingsButton />
    </header>
    {done ? <section className="review-done" data-testid="review-done">
      <div className="done-mark" aria-hidden="true">✓</div>
      <h2>{idx === 0 ? '现在没有到期的卡' : '这一轮完成了'}</h2>
      {idx > 0 && <p className="tally">
        <span className="again">忘了 {tally.again}</span><span className="good">记得 {tally.good}</span><span className="easy">很熟 {tally.easy}</span>
      </p>}
      <p className="muted">{idx === 0 ? '每天几张，按记忆曲线到期自动出现。' : '忘了的卡会尽快再出现，记得的隔天、三天、一周……逐渐拉长。'}</p>
      <div className="btn-row">
        <a className="btn" href={hrefs.home()}>回学习首页</a>
        <a className="btn primary" href={hrefs.cards()}>读概念卡</a>
      </div>
    </section>
      : <>
        <div className="review-progress" aria-label={`第 ${idx + 1} 张，共 ${queue.length} 张`}>
          <span style={{ width: `${((idx + 1) / queue.length) * 100}%` }} />
          <em>{idx + 1}/{queue.length}</em>
        </div>
        <button type="button" className={`flip ${flipped ? 'flipped' : ''}`} data-testid="flip" aria-label={flipped ? '看正面' : '看答案'}
          onClick={() => setFlipped(!flipped)}>
          <span className="face front">
            <em className="kind">{current.kind === 'term' ? '术语' : '问题'}</em>
            <strong>{current.front}</strong>
            {current.sub && <small>{current.sub}</small>}
            <span className="tap-hint">点一下看答案</span>
          </span>
          <span className="face answer" aria-hidden={!flipped}>
            <em className="kind">答案</em>
            <span>{current.back}</span>
          </span>
        </button>
        <div className={`rate ${flipped ? 'show' : ''}`}>
          {RATINGS.map((r) => <button key={r.q} type="button" className={`btn ${r.cls}`} disabled={!flipped} onClick={() => answer(r.q)}>{r.label}</button>)}
        </div>
        {!flipped && <p className="hint center">空格 / 点卡片翻面，翻面后可选 记得程度</p>}
      </>}
  </main>;
}
