import { useMemo, useState } from 'react';
import { exportNotes, readNotes } from '../lib/notes';
import { buildItems, dueCount, masteredCount, readSched } from '../lib/review';
import { hrefs } from '../lib/router';
import { cardById, paths, readProgress, studyCards } from '../lib/study';
import { SettingsButton } from './Settings';

export function MePage() {
  const progress = useMemo(readProgress, []);
  const notes = useMemo(readNotes, []);
  const sched = useMemo(readSched, []);
  const items = useMemo(buildItems, []);
  const [exported, setExported] = useState(false);
  const read = new Set(progress.read.filter((id) => cardById.has(id)));
  const favs = progress.favorites.map((id) => cardById.get(id)).filter((c) => c !== undefined);
  const caseNotes = useMemo(() => Object.entries(notes).filter(([k]) => /^c[12]s\d+$/.test(k)), [notes]);
  const due = dueCount(items, sched);
  const mastered = masteredCount(sched);
  return <main className="page me-page" data-testid="me-page">
    <header className="appbar">
      <div className="appbar-title"><h1>我的学习</h1><p>进度、收藏与笔记只保存在这台设备</p></div>
      <SettingsButton />
    </header>

    <section className="stats-grid" data-testid="stats">
      <a className="stat" href={hrefs.cards()}><strong>{read.size}<small>/{studyCards.length}</small></strong><span>已读概念卡</span></a>
      <a className="stat" href={hrefs.review()}><strong>{due}</strong><span>闪卡到期</span></a>
      <a className="stat" href={hrefs.review()}><strong>{mastered}</strong><span>已熟练</span></a>
      <span className="stat"><strong>{favs.length}</strong><span>收藏</span></span>
    </section>

    <section className="panel"><h2>路径进度</h2>
      <ul className="me-paths">{paths.map((p) => {
        const done = p.cardIds.filter((id) => read.has(id)).length;
        return <li key={p.id}><a href={hrefs.paths(p.id)}>
          <span className="me-path-title">{p.title}</span>
          <span className="me-bar" aria-hidden="true"><span style={{ width: `${(done / p.cardIds.length) * 100}%` }} /></span>
          <span className="muted">{done}/{p.cardIds.length}</span>
        </a></li>;
      })}</ul>
    </section>

    <section className="panel"><h2>收藏（{favs.length}）</h2>
      {favs.length === 0 ? <p className="muted">还没有收藏。在概念卡右上角点 ☆ 即可。</p>
        : <ul className="case-links" data-testid="fav-list">{favs.map((c) => <li key={c.id}>
          <a href={hrefs.cards(c.id)}>{c.title}<span className="muted"> · {c.stageLabel}/{c.topic}</span></a></li>)}</ul>}
    </section>

    <section className="panel"><h2>临床演示笔记（{caseNotes.length}）</h2>
      {caseNotes.length === 0 ? <p className="muted">笔记写在临床演示的每一节里，需要先解锁。</p>
        : <ul className="case-links" data-testid="case-notes">{caseNotes.map(([sectionId, text]) => {
          const [, c, n] = sectionId.match(/^c(\d+)s(\d+)$/)!;
          return <li key={sectionId}>
            <a href={hrefs.talk(`case${c}`, sectionId)}>案例{c} · 第{n}节 <span className="muted">· 需解锁</span></a>
            <p className="me-note">{text.length > 100 ? text.slice(0, 100) + '…' : text}</p>
          </li>;
        })}</ul>}
      {caseNotes.length > 0 && <div className="btn-row"><button type="button" className="btn" onClick={() => setExported(exportNotes() > 0)}>导出笔记</button></div>}
      {exported && <p className="hint" role="status">已导出为 JSON 文件，请自行保管。</p>}
      <p className="hint">笔记与备份请勿公开分享，不要记录可识别的真实个案信息。</p>
    </section>

    <p className="hint">换设备或清理浏览器数据会丢失进度；本站不上传个人数据，也没有账号。</p>
  </main>;
}
