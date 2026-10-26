import { cardById, series, seriesByCard, sessionById } from '../data';
import { hrefs } from '../lib/router';
import { useUser } from '../lib/store';

export function StudyPaths() {
  const { read } = useUser();
  const done = new Set(read);
  return (
    <div data-testid="study-paths">
      <p className="study-intro muted">六组连续精读。先看卡片的问题与要点，展开后进入论证、例子和文本；也可从基础卡补课。已读进度沿用本机记录。</p>
      <ul className="entries">
        {series.map((item) => {
          const completed = item.cardIds.filter((id) => done.has(id)).length;
          const next = item.cardIds.find((id) => !done.has(id)) ?? item.cardIds[0];
          return (
            <li className="entry study-path" key={item.id} data-series-id={item.id}>
              <p className="study-kicker">{item.axis} · {item.cardIds.length}篇 · 已读{completed}/{item.cardIds.length}</p>
              <h2>{item.title}</h2>
              <p>{item.intro}</p>
              <p className="muted">读完能够：{item.outcome}</p>
              <a className="study-start" href={hrefs.card(next)}>{completed === item.cardIds.length ? '重新阅读' : completed ? '继续专题' : '开始阅读'}</a>
              <ol>{item.cardIds.map((id) => <li key={id}><a href={hrefs.detail(id)}>{cardById.get(id)?.title}</a>{done.has(id) && <span className="muted"> · 已读</span>}</li>)}</ol>
              <p className="muted">基础补课</p>
              <div className="series-links">{item.foundationIds.map((id) => <a className="btn-link" key={id} href={hrefs.card(id)}>{cardById.get(id)?.title}</a>)}</div>
              {item.sessionIds.length > 0 && <p className="muted">关联场次：{item.sessionIds.map((id, i) => {
                const session = sessionById.get(id)!;
                return <span key={id}>{i > 0 && '；'}<a href={hrefs.agenda(String(session.day), id)}>{session.date.slice(5)} {session.title}</a></span>;
              })}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SeriesNav({ cardId }: { cardId: string }) {
  const item = seriesByCard.get(cardId);
  if (!item) return null;
  const index = item.cardIds.indexOf(cardId);
  const prev = item.cardIds[index - 1];
  const next = item.cardIds[index + 1];
  return <nav className="series-nav" aria-label="专题阅读导航" data-testid="series-nav">
    <p>{item.title} · {index + 1}/{item.cardIds.length}</p>
    <div className="series-links">
      {prev && <a href={hrefs.detail(prev)}>上一篇：{cardById.get(prev)?.title}</a>}
      {next && <a href={hrefs.detail(next)}>下一篇：{cardById.get(next)?.title}</a>}
      <a href={hrefs.guide('series')}>返回专题目录</a>
    </div>
  </nav>;
}
