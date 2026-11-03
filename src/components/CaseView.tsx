import { hrefs, navigate } from '../lib/router';
import type { Case } from '../types';
import { Notes } from './Notes';
import { SettingsButton } from './Settings';
import { Talk } from './Talk';

export function CaseView({ c, tab, sectionId }: { c: Case; tab: 'talk' | 'notes'; sectionId?: string }) {
  return <main className="case" data-testid="case">
    <header className="appbar">
      <a className="back" href={hrefs.home()} aria-label="返回案例列表">‹</a>
      <div className="appbar-title"><h1>{c.label}</h1><p>{c.date}</p></div>
      <SettingsButton />
    </header>
    <nav className="tabs" aria-label="视图">
      {(['talk', 'notes'] as const).map((t) => <a key={t} href={t === 'talk' ? hrefs.talk(c.id) : hrefs.notes(c.id)}
        aria-current={tab === t ? 'page' : undefined} className={tab === t ? 'on' : ''}
        onClick={(e) => { e.preventDefault(); navigate(t === 'talk' ? hrefs.talk(c.id) : hrefs.notes(c.id), true); }}>
        {t === 'talk' ? '对话' : '要点'}</a>)}
    </nav>
    {tab === 'talk' ? <Talk key={c.id} c={c} sectionId={sectionId} /> : <Notes c={c} />}
  </main>;
}
