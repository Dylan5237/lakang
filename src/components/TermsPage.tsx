import { studyCards, terms } from '../data';
import { hrefs } from '../lib/router';

export function TermsPage() {
  return <main className="page guide" data-testid="terms">
    <header className="page-head"><h1>术语</h1><p className="muted">每条给出简短释义，并链接到展开讲解的卡片。</p></header>
    <ul className="entries" data-testid="term-list">{terms.map((t) => {
      const used = studyCards.filter((c) => c.termIds?.includes(t.id));
      return <li key={t.id} className="entry" id={`term-${t.id}`}><h2>{t.zh} <span className="muted orig">{t.original}</span></h2><p>{t.text}</p>
        {used.length > 0 && <p>{used.map((c) => <a key={c.id} className="btn-link" href={hrefs.card(c.id)}>{c.title}</a>)}</p>}
      </li>;
    })}</ul>
  </main>;
}
