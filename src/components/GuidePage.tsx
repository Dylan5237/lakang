import { cards, sessions, shelf, sourceById, speakers, terms } from '../data';
import { hrefs, navigate } from '../lib/router';

const tabs = [
  { id: 'speakers', label: '讲者' },
  { id: 'terms', label: '术语' },
  { id: 'shelf', label: '书架' },
];

export function GuidePage({ tab }: { tab?: string }) {
  const current = tabs.some((t) => t.id === tab) ? tab! : 'speakers';
  return (
    <main className="page guide" data-testid="guide">
      <header className="page-head">
        <h1>指南</h1>
        <p className="muted">讲者、术语与预读书架。每一项都连着对应的知识卡。</p>
      </header>
      <div role="tablist" aria-label="指南分类" className="tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={current === t.id} className={`tab ${current === t.id ? 'on' : ''}`} onClick={() => navigate(hrefs.guide(t.id), { replace: true })}>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {current === 'speakers' && (
        <ul className="entries" data-testid="speaker-list">
          {speakers.map((s) => {
            const own = sessions.filter((x) => x.speakerIds.includes(s.id));
            return (
              <li key={s.id} className="entry">
                <h2>
                  {s.name} {s.original && <span className="muted orig">{s.original}</span>}
                </h2>
                <p>{s.intro}</p>
                <p className="muted">关注线索：{s.thread}</p>
                {own.length > 0 && (
                  <p className="muted">
                    场次：
                    {own.map((x, i) => (
                      <span key={x.id}>
                        {i > 0 && '；'}
                        <a href={hrefs.agenda(String(x.day), x.id)}>
                          {x.date.slice(5).replace('-', '/')} {x.start}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
                <p>
                  <a className="btn-link" href={hrefs.card(s.cardId)}>
                    读讲者卡
                  </a>
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {current === 'terms' && (
        <ul className="entries" data-testid="term-list">
          {terms.map((t) => {
            const used = cards.filter((c) => c.termIds?.includes(t.id));
            return (
              <li key={t.id} className="entry">
                <h2>
                  {t.zh} <span className="muted orig">{t.original}</span>
                </h2>
                <p>{t.text}</p>
                {used.length > 0 && (
                  <p>
                    {used.map((c) => (
                      <a key={c.id} className="btn-link" href={hrefs.card(c.id)}>
                        {c.title}
                      </a>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {current === 'shelf' && (
        <ul className="entries" data-testid="shelf-list">
          {shelf.map((b) => (
            <li key={b.id} className="entry">
              <h2>{b.title}</h2>
              <p>{b.how}</p>
              <p className="muted">
                {b.sourceIds.map((id, i) => {
                  const s = sourceById.get(id);
                  return s ? (
                    <span key={id}>
                      {i > 0 && '；'}
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {id} 出处
                      </a>
                    </span>
                  ) : null;
                })}
              </p>
            </li>
          ))}
          <li className="entry hint-entry">
            <p className="muted">书目入口不代表可再发布；请通过合法渠道获取全文。</p>
          </li>
        </ul>
      )}
    </main>
  );
}
