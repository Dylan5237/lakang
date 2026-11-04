import { useMemo } from 'react';
import { hrefs } from '../lib/router';
import { cardById, paths, pathById, readProgress } from '../lib/study';
import type { StudyPath } from '../types';
import { SearchAllButton } from './GlobalSearch';
import { SettingsButton } from './Settings';

const nextOf = (p: StudyPath, read: Set<string>) => p.cardIds.find((id) => !read.has(id)) ?? p.cardIds[0];

export function PathsPage({ pathId }: { pathId?: string }) {
  const progress = useMemo(readProgress, []);
  const read = useMemo(() => new Set(progress.read), [progress.read]);
  const path = pathId ? pathById.get(pathId) : undefined;
  if (pathId && !path) return <main className="page"><h1>没有这条路径</h1><a className="btn" href={hrefs.paths()}>返回路径</a></main>;
  if (path) return <PathDetail path={path} read={read} />;
  return <main className="page paths" data-testid="paths">
    <header className="page-head">
      <div className="page-tools"><SearchAllButton archive={null} /><SettingsButton /></div>
      <h1>阅读路径</h1>
      <p className="muted">{paths.length} 条路线，覆盖全部学习卡。按顺序读，也可以只挑需要的。</p>
    </header>
    <ol className="path-list">{paths.map((p, i) => {
      const done = p.cardIds.filter((id) => read.has(id)).length;
      const next = nextOf(p, read);
      return <li key={p.id} className="path-card" data-path-id={p.id}>
        <p className="study-kicker">路线 {i + 1} · {p.cardIds.length} 张 · 已读 {done}/{p.cardIds.length}</p>
        <h2><a href={hrefs.paths(p.id)}>{p.title}</a></h2>
        <p>{p.intro}</p>
        <div className="case-progress" aria-hidden="true"><span style={{ width: `${(done / p.cardIds.length) * 100}%` }} /></div>
        <div className="case-actions">
          <a className="btn primary" href={hrefs.cards(next)}>{done === p.cardIds.length ? '重新阅读' : done ? `继续 · 第 ${done + 1} 张` : '开始'}</a>
          <a className="btn" href={hrefs.paths(p.id)}>查看目录</a>
        </div>
      </li>;
    })}</ol>
  </main>;
}

function PathDetail({ path, read }: { path: StudyPath; read: Set<string> }) {
  const done = path.cardIds.filter((id) => read.has(id)).length;
  const next = nextOf(path, read);
  return <main className="page paths" data-testid="path-detail" data-path-id={path.id}>
    <header className="page-head">
      <div className="page-tools"><SearchAllButton archive={null} /><SettingsButton /></div>
      <a className="btn-link" href={hrefs.paths()}>返回路径</a>
      <h1>{path.title}</h1>
      <p>{path.intro}</p>
      <p className="muted">读完能够：{path.outcome}</p>
      <div className="case-progress" aria-hidden="true"><span style={{ width: `${(done / path.cardIds.length) * 100}%` }} /></div>
      <p className="muted">已读 {done}/{path.cardIds.length}</p>
      <a className="btn primary" href={hrefs.cards(next)}>{done === path.cardIds.length ? '重新阅读' : done ? `继续 · 第 ${done + 1} 张` : '开始阅读'}</a>
    </header>
    <ol className="path-cards">{path.cardIds.map((id, i) => {
      const card = cardById.get(id)!;
      return <li key={id} className={`path-item ${read.has(id) ? 'done' : ''}`}>
        <span className="path-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <div>
          <a href={hrefs.cards(id)}>{card.title}</a>
          <p className="muted">{card.stageLabel} · {card.topic}{read.has(id) ? ' · 已读' : ''}</p>
        </div>
      </li>;
    })}</ol>
  </main>;
}
