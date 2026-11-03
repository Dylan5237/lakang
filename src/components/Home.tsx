import { useMemo, useState } from 'react';
import { exportNotes, readNotes } from '../lib/notes';
import { readPositions } from '../lib/reading';
import { hrefs } from '../lib/router';
import { buildItems, dueCount, readSched } from '../lib/review';
import { cardById, readProgress, studyCards, terms } from '../lib/study';
import type { Archive } from '../types';
import { SearchAllButton } from './GlobalSearch';
import { SettingsButton } from './Settings';

export function Home({ archive, onLock }: { archive: Archive | null; onLock: () => void }) {
  const [about, setAbout] = useState(false);
  const [exported, setExported] = useState(false);
  const positions = readPositions();
  const notes = readNotes();
  const noteItems = archive ? archive.cases.flatMap((c) =>
    c.sections.filter((s) => notes[s.id]).map((s) => ({ c, s, text: notes[s.id] }))) : [];
  const progress = readProgress();
  const items = useMemo(buildItems, []);
  const readCount = progress.read.filter((id) => cardById.has(id)).length;
  const due = dueCount(items, readSched());
  const resume = progress.position && cardById.has(progress.position) ? cardById.get(progress.position)! : undefined;
  return <main className="home" data-testid="home">
    <div className="hero-glow" aria-hidden="true" />
    <header className="hero">
      <div className="hero-top">
        <span className="eyebrow">拉康精神分析学习卡</span>
        <div className="hero-tools">
          <SearchAllButton archive={archive} />
          <SettingsButton />
          {archive && <button type="button" className="ghost" onClick={onLock}>锁定</button>}
        </div>
      </div>
      <h1>拉康随身读</h1>
      <p className="hero-sub">概念 · 术语 · 临床演示记录</p>
    </header>
    <section aria-labelledby="learn-h"><h2 id="learn-h" className="section-h">学习</h2>
      <div className="modules" data-testid="modules">
        <a className="module" href={hrefs.cards(resume?.id)} data-testid="module-cards">
          <span className="m-ico ico-cards" aria-hidden="true">卡</span>
          <strong>概念卡</strong><span>{studyCards.length} 张 · 已读 {readCount}</span>
          <span className="module-go">{resume ? `继续《${resume.title.slice(0, 12)}》` : '开始'}</span>
        </a>
        <a className="module" href={hrefs.review()} data-testid="module-review">
          <span className="m-ico ico-review" aria-hidden="true">复</span>
          <strong>闪卡复习</strong><span>{due} 张到期 · 按记忆曲线安排</span>
          <span className="module-go">{due ? '开始复习' : '暂无到期'}</span>
        </a>
        <a className="module" href={hrefs.terms()} data-testid="module-terms">
          <span className="m-ico ico-terms" aria-hidden="true">词</span>
          <strong>术语词典</strong><span>{terms.length} 条 · 含案例回链</span><span className="module-go">查阅</span>
        </a>
      </div>
    </section>
    <section aria-labelledby="case-h"><h2 id="case-h" className="section-h">临床演示</h2>
      {archive ? <ol className="cases">{archive.cases.map((c, i) => {
        const turns = c.sections.reduce((n, s) => n + s.turns.length, 0);
        const pos = positions[c.id];
        const idx = c.sections.findIndex((s) => s.id === pos);
        const analyst = c.legend.find((l) => l.role === 'analyst')?.text.replace(/^分析师\s*=\s*/, '').replace(/（.*$/, '');
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
          <span>两场案例 · 私人资料，输入访问密码阅读</span>
          <span className="module-go">解锁</span>
        </a>}
    </section>
    {noteItems.length > 0 && <section className="my-notes" data-testid="my-notes">
      <h2>我的笔记（{noteItems.length}）</h2>
      <ul>{noteItems.map(({ c, s, text }) => <li key={s.id}>
        <a href={hrefs.talk(c.id, s.id)}>{c.label} · {s.title}</a>
        <p>{text.length > 80 ? text.slice(0, 80) + '…' : text}</p>
      </li>)}</ul>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => setExported(exportNotes() > 0)}>导出笔记</button>
      </div>
      {exported && <p className="hint" role="status">已导出为 JSON 文件，请自行保管。</p>}
      <p className="hint">笔记只保存在这台设备的浏览器里，不上传；请勿记录可识别的真实个案信息。</p>
    </section>}
    {archive && <button type="button" className="about-toggle" aria-expanded={about} onClick={() => setAbout(!about)}>关于这份记录 {about ? '▴' : '▾'}</button>}
    {about && archive && <div className="about" data-testid="about">{archive.notice.map((n, i) => <p key={i}>{n.replace(/^⚠️\s*/, '')}</p>)}</div>}
  </main>;
}
