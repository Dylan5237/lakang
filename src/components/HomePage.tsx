import { cardById, series, studyCardIds, studyCards } from '../data';
import { hrefs } from '../lib/router';
import { useUser } from '../lib/store';
import type { Card } from '../types';

const inSeries = new Set(series.flatMap((s) => s.cardIds));
const loose = (pick: (c: Card) => boolean) => studyCards.filter((c) => !inSeries.has(c.id) && pick(c)).map((c) => c.id);

// Every study card belongs to exactly one step; tests check the partition.
export const learningSteps = [
  { id: 'start', title: '从问题进入', intro: '先用几个具体问题看清：身体、言说与主体，为什么需要分开来想。', cardIds: loose((c) => c.stage === 'question') },
  { id: 'concepts', title: '核心概念', intro: '三界、能指、驱力、享乐、症状与圣状等基础概念，各自回答什么问题。', cardIds: loose((c) => c.stage === 'concept') },
  { id: 'series', title: '专题精读', intro: '六组连续精读：欲望、身体、症状、分析过程、艺术与社会、阅读地图。', cardIds: series.flatMap((s) => s.cardIds), href: hrefs.guide('series') },
  { id: 'themes', title: '议题与临床', intro: '把概念放回具体议题：书写、节奏、并入、青少年、移情与研究阅读。', cardIds: loose((c) => c.stage !== 'question' && c.stage !== 'concept') },
];

export function HomePage({ offlineReady }: { offlineReady: boolean }) {
  const user = useUser();
  const done = new Set(user.read);
  const resume = user.position && studyCardIds.has(user.position) ? cardById.get(user.position) : undefined;
  const readCount = studyCards.filter((c) => done.has(c.id)).length;
  return <main className="page home" data-testid="home">
    <header className="page-head">
      <h1>拉康随身读</h1>
      <p className="muted">拉康精神分析学习卡：从问题出发，读概念、专题与原文出处。{offlineReady && <span className="pill" data-testid="offline-pill">离线已就绪</span>}</p>
      <p className="muted">已读 {readCount} / {studyCards.length} 张</p>
    </header>
    {resume && <section className="panel" data-testid="resume"><h2>继续阅读</h2><p><a href={hrefs.card(resume.id)}>{resume.title}</a></p></section>}
    <section aria-labelledby="path-h"><h2 id="path-h" className="section-h">学习路径</h2>
      <ol className="entries learn-steps" data-testid="learning-steps">{learningSteps.map((step, i) => {
        const completed = step.cardIds.filter((id) => done.has(id)).length;
        const next = step.cardIds.find((id) => !done.has(id)) ?? step.cardIds[0];
        return <li key={step.id} className="entry" data-step-id={step.id}>
          <p className="study-kicker">第 {i + 1} 步 · {step.cardIds.length} 张 · 已读 {completed}/{step.cardIds.length}</p>
          <h2>{step.title}</h2><p>{step.intro}</p>
          <div className="btn-row"><a className="study-start" href={step.href ?? hrefs.card(next)}>{step.href ? '进入专题' : completed === step.cardIds.length ? '重新阅读' : completed ? '继续' : '开始'}</a></div>
          {!step.href && <details><summary>卡片目录</summary><ol>{step.cardIds.map((id) => <li key={id}><a href={hrefs.detail(id)}>{cardById.get(id)?.title}</a>{done.has(id) && <span className="muted"> · 已读</span>}</li>)}</ol></details>}
        </li>;
      })}</ol>
    </section>
    <section className="panel"><h2>工具</h2><div className="btn-row">
      <a className="btn-link" href={hrefs.feed()}>随机刷卡</a>
      <a className="btn-link" href={hrefs.terms()}>术语表</a>
      <a className="btn-link" href={hrefs.guide('shelf')}>书架</a>
      <a className="btn-link" href={hrefs.archive()}>2026 大会归档</a>
    </div></section>
  </main>;
}
