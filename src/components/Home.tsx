import { useState } from 'react';
import { exportNotes, readNotes } from '../lib/notes';
import { readPositions } from '../lib/reading';
import { hrefs } from '../lib/router';
import type { Archive } from '../types';
import { SearchAllButton } from './GlobalSearch';
import { SettingsButton } from './Settings';

export function Home({ archive, onLock }: { archive: Archive; onLock: () => void }) {
  const [about, setAbout] = useState(false);
  const [exported, setExported] = useState(false);
  const positions = readPositions();
  const notes = readNotes();
  const noteItems = archive.cases.flatMap((c) =>
    c.sections.filter((s) => notes[s.id]).map((s) => ({ c, s, text: notes[s.id] })));
  return <main className="home" data-testid="home">
    <header className="hero">
      <div className="hero-top">
        <span className="eyebrow">拉康随身读</span>
        <div className="hero-tools">
          <SearchAllButton archive={archive} />
          <SettingsButton />
          <button type="button" className="ghost" onClick={onLock}>锁定</button>
        </div>
      </div>
      <h1>{archive.title}</h1>
      <button type="button" className="about-toggle" aria-expanded={about} onClick={() => setAbout(!about)}>关于这份记录 {about ? '▴' : '▾'}</button>
      {about && <div className="about" data-testid="about">{archive.notice.map((n, i) => <p key={i}>{n.replace(/^⚠️\s*/, '')}</p>)}</div>}
    </header>
    <ol className="cases">{archive.cases.map((c, i) => {
      const turns = c.sections.reduce((n, s) => n + s.turns.length, 0);
      const pos = positions[c.id];
      const idx = c.sections.findIndex((s) => s.id === pos);
      const analyst = c.legend.find((l) => l.role === 'analyst')?.text.replace(/^分析师\s*=\s*/, '').replace(/（.*$/, '');
      return <li key={c.id} className="case-card" data-case-id={c.id}>
        <span className="case-no">案例 {i + 1}</span>
        <h2><a href={hrefs.talk(c.id)}>{c.label}</a></h2>
        <p className="case-meta">{c.date}{analyst && ` · 分析师 ${analyst}`}</p>
        <p className="case-stats">{c.sections.length} 节 · {turns} 段发言 · {c.groups.reduce((n, g) => n + g.cards.length, 0)} 张要点</p>
        {idx >= 0 && <div className="case-progress" aria-label={`读到第 ${idx + 1} 节`}><span style={{ width: `${((idx + 1) / c.sections.length) * 100}%` }} /></div>}
        <div className="case-actions">
          <a className="btn primary" href={hrefs.talk(c.id, idx >= 0 ? pos : undefined)}>{idx >= 0 ? `继续 · 第 ${idx + 1} 节` : '读对话'}</a>
          <a className="btn" href={hrefs.notes(c.id)}>看要点</a>
        </div>
      </li>;
    })}</ol>
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
  </main>;
}
