import { useCallback, useState } from 'react';
import { hrefs, navigate } from '../lib/router';
import type { Case } from '../types';
import { Notes } from './Notes';
import { SettingsButton } from './Settings';
import { Talk } from './Talk';

export function CaseView({ c, tab, sectionId }: { c: Case; tab: 'talk' | 'notes'; sectionId?: string }) {
  const [tocOpen, setTocOpen] = useState(false);
  const [pos, setPos] = useState({ index: 0, total: c.sections.length });
  const onProgress = useCallback((index: number, total: number) => setPos({ index, total }), []);
  return <main className="case" data-testid="case">
    <header className="appbar">
      <a className="back" href={hrefs.home()} aria-label="返回学习首页">‹</a>
      <div className="appbar-title"><h1>{c.label}<span className="appbar-date"> · {c.date}</span></h1></div>
      {tab === 'talk' && <button type="button" className="toc-trigger" onClick={() => setTocOpen(true)} data-testid="open-toc" aria-label="目录">
        目录 <b>{pos.index + 1}/{pos.total}</b>
      </button>}
      <SettingsButton />
    </header>
    <nav className="tabs case-tabs" aria-label="视图">
      {(['talk', 'notes'] as const).map((t) => <a key={t} href={t === 'talk' ? hrefs.talk(c.id) : hrefs.notes(c.id)}
        aria-current={tab === t ? 'page' : undefined} className={tab === t ? 'on' : ''}
        onClick={(e) => { e.preventDefault(); navigate(t === 'talk' ? hrefs.talk(c.id) : hrefs.notes(c.id), true); }}>
        {t === 'talk' ? '对话' : '要点'}</a>)}
    </nav>
    {tab === 'talk'
      ? <Talk key={c.id} c={c} sectionId={sectionId} tocOpen={tocOpen} onTocClose={() => setTocOpen(false)} onProgress={onProgress} />
      : <Notes c={c} />}
  </main>;
}
