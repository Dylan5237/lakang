import { useMemo, useState } from 'react';
import { DAILY_GOAL, readHabit } from '../lib/habit';
import { readPositions } from '../lib/reading';
import { hrefs } from '../lib/router';
import { buildItems, dueCount, readSched } from '../lib/review';
import { cardById, paths, readProgress, studyCards } from '../lib/study';
import type { Archive } from '../types';
import { SearchAllButton } from './GlobalSearch';
import { SettingsButton } from './Settings';

const dateLabel = () => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());

export function Home({ archive, onLock }: { archive: Archive | null; onLock: () => void }) {
  const [about, setAbout] = useState(false);
  const positions = readPositions();
  const progress = readProgress();
  const items = useMemo(buildItems, []);
  const readCount = progress.read.filter((id) => cardById.has(id)).length;
  const due = dueCount(items, readSched());
  const habit = readHabit();
  const read = new Set(progress.read);
  const active = paths.map((p) => ({ p, done: p.cardIds.filter((id) => read.has(id)).length })).filter((x) => x.done > 0 && x.done < x.p.cardIds.length).slice(0, 2);
  const resume = progress.position && cardById.has(progress.position) ? cardById.get(progress.position)! : undefined;
  return <main className="home" data-testid="home">
    <header className="topbar">
      <div className="topbar-row">
        <div><span className="eyebrow">{dateLabel()}</span><h1>拉康随身读</h1></div>
        <div className="hero-tools">
          <SearchAllButton archive={archive} />
          <SettingsButton />
          {archive && <button type="button" className="ghost lock-toggle" onClick={onLock}>锁定</button>}
        </div>
      </div>
    </header>
    <section className="today" aria-label="今日学习" data-testid="today">
      {resume
        ? <a className="resume" href={hrefs.cards(resume.id)} data-testid="resume">
          <small>继续阅读 · 已读 {readCount}/{studyCards.length}</small><strong>{resume.title}</strong>
        </a>
        : <a className="resume" href={hrefs.paths('start-body')} data-testid="start-here">
          <small>第一次来？约 10 分钟</small><strong>从「入门一：身体的三个入口」开始</strong>
        </a>}
      <div className="today-row">
        <div className="today-goal" data-testid="goal">
          <span>今日 <strong>{Math.min(habit.cardsToday, DAILY_GOAL)}/{DAILY_GOAL}</strong> 张{habit.cardsToday >= DAILY_GOAL ? ' · 达成' : ''}</span>
          <span className="me-bar" aria-hidden="true"><span style={{ width: `${Math.min(1, habit.cardsToday / DAILY_GOAL) * 100}%` }} /></span>
          <span className="hint">{habit.streak > 0 ? `连续学习 ${habit.streak} 天` : '读满 3 张，开始你的连续天数'}</span>
        </div>
        <a className={`today-review ${due ? 'due' : ''}`} href={hrefs.review()}><strong>{due}</strong><span>{due ? '张待复习' : '暂无复习'}</span></a>
      </div>
    </section>
    {active.length > 0 && <section aria-labelledby="learn-h"><h2 id="learn-h" className="section-h">进行中的路径</h2>
      <ul className="path-mini-list" data-testid="paths-active">{active.map(({ p, done }) => <li key={p.id}>
        <a className="path-mini" href={hrefs.cards(p.cardIds.find((id) => !read.has(id)))}>
          <strong>{p.title}</strong>
          <span className="me-bar" aria-hidden="true"><span style={{ width: `${(done / p.cardIds.length) * 100}%` }} /></span>
          <span className="hint">已读 {done}/{p.cardIds.length} · 读下一张</span>
        </a></li>)}</ul>
    </section>}
    <section aria-labelledby="case-h"><h2 id="case-h" className="section-h">临床演示</h2>
      {archive ? <ol className="cases">{archive.cases.map((c, i) => {
        const turns = c.sections.reduce((n, s) => n + s.turns.length, 0);
        const pos = positions[c.id];
        const idx = c.sections.findIndex((s) => s.id === pos);
        const analyst = c.legend.find((l) => l.role === 'analyst')?.text
          .replace(/^分析师\s*[=：:]\s*/, '')
          .split(/\s*[=，,]\s*/)[0]
          .replace(/（.*$/, '');
        return <li key={c.id} className="case-card" data-case-id={c.id}>
          <span className="case-no">案例 {i + 1}</span>
          <h3><a href={hrefs.talk(c.id)}>{c.label}</a></h3>
          <p className="case-meta">{c.date}{analyst && ` · 分析师 ${analyst}`}</p>
          <p className="case-stats">{c.sections.length} 节 · {turns} 段发言 · {c.groups.reduce((n, g) => n + g.cards.length, 0)} 张要点</p>
          {idx >= 0 && <div className="case-progress" aria-label={`读到第 ${idx + 1} 节`}><span style={{ width: `${((idx + 1) / c.sections.length) * 100}%` }} /></div>}
          <div className="case-actions">
            <a className="btn primary" href={hrefs.talk(c.id, idx >= 0 ? pos : undefined)}>{idx >= 0 ? `继续 · 第 ${idx + 1} 节` : '读对话'}</a>
            <a className="btn" href={hrefs.notes(c.id)}>看要点</a>
          </div>
        </li>;
      })}</ol>
        : <a className="case-card locked" href={hrefs.talk('case1')} data-testid="locked-cases">
          <strong>临床演示记录</strong>
          <span>四场案例（10/28—10/31） · 私人资料，输入访问密码阅读</span>
          <span className="module-go">解锁</span>
        </a>}
    </section>
    {archive && <button type="button" className="about-toggle" aria-expanded={about} onClick={() => setAbout(!about)}>关于这份记录 {about ? '▴' : '▾'}</button>}
    {about && archive && <div className="about" data-testid="about">{archive.notice.map((n, i) => <p key={i}>{n.replace(/^⚠️\s*/, '')}</p>)}</div>}
    <footer className="site-foot"><a href={hrefs.about()} data-testid="about-link">关于本站 · 方法与隐私</a></footer>
  </main>;
}
