import { shelf, sourceById } from '../data';
import { hrefs, navigate } from '../lib/router';
import { StudyPaths } from './StudyPaths';

const tabs = [
  { id: 'series', label: '专题精读' },
  { id: 'shelf', label: '书架' },
];

export function GuidePage({ tab }: { tab?: string }) {
  const current = tabs.some((t) => t.id === tab) ? tab! : 'series';
  return (
    <main className="page guide" data-testid="guide">
      <header className="page-head"><h1>专题精读</h1><p className="muted">从一个问题进入，沿文本、概念与具体例子读下去。</p></header>
      <div role="tablist" aria-label="指南分类" className="tabs">
        {tabs.map((t) => <button key={t.id} type="button" role="tab" aria-selected={current === t.id} className={`tab ${current === t.id ? 'on' : ''}`} onClick={() => navigate(hrefs.guide(t.id), { replace: true })}><span>{t.label}</span></button>)}
      </div>
      {current === 'series' && <StudyPaths />}
      {current === 'shelf' && (
        <ul className="entries" data-testid="shelf-list">{shelf.map((b) => <li key={b.id} className="entry"><h2>{b.title}</h2><p>{b.how}</p>
          <p className="muted">{b.sourceIds.map((id, i) => { const s = sourceById.get(id); return s ? <span key={id}>{i > 0 && '；'}<a href={s.url} target="_blank" rel="noopener noreferrer">{id} 出处</a></span> : null; })}</p>
        </li>)}<li className="entry hint-entry"><p className="muted">书目入口不代表可再发布；请通过合法渠道获取全文。</p></li></ul>
      )}
    </main>
  );
}
