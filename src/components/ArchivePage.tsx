import { conference, conferenceCards, officialArticles, retiredCards, sessions, speakers } from '../data';
import { hrefs } from '../lib/router';

export function ArchivePage() {
  const first = sessions[0].date;
  const last = sessions[sessions.length - 1].date;
  const others = conferenceCards.filter((c) => c.stage !== 'official' && c.stage !== 'speakers');
  return <main className="page guide" data-testid="archive">
    <header className="page-head"><a className="btn-link" href={hrefs.home()}>返回学习首页</a><h1>2026 大会归档</h1>
      <p className="muted">{conference.name} · {conference.theme} · {first.replace(/-/g, '/')}—{last.slice(5).replace('-', '/')}</p>
      <p className="muted">会前整理的日程、讲者与官方前瞻保留在这里，供回看；不再更新会务信息。</p>
    </header>
    <section className="panel"><h2>入口</h2><div className="btn-row">
      <a className="btn-link" href={hrefs.agenda('all')}>日程总览</a>
      <a className="btn-link" href={hrefs.previews()}>官方前瞻（{officialArticles.length} 篇原文）</a>
      <a className="btn-link" href={hrefs.previews('appendix')}>附录（{retiredCards.length}）</a>
    </div></section>
    <section><h2 className="section-h">讲者</h2>
      <ul className="entries" data-testid="speaker-list">{speakers.map((s) => {
        const own = sessions.filter((x) => x.speakerIds.includes(s.id));
        return <li key={s.id} className="entry">
          <h2>{s.name} {s.original && <span className="muted orig">{s.original}</span>}</h2>
          <p>{s.intro}</p><p className="muted">关注线索：{s.thread}</p>
          {own.length > 0 && <p className="muted">场次：{own.map((x, i) => <span key={x.id}>{i > 0 && '；'}<a href={hrefs.agenda(String(x.day), x.id)}>{x.date.slice(5).replace('-', '/')} {x.start}</a></span>)}</p>}
          <p><a className="btn-link" href={hrefs.card(s.cardId)}>读讲者卡</a></p>
        </li>;
      })}</ul>
    </section>
    <section><h2 className="section-h">会议主线与现场工具</h2>
      <ul className="entries">{others.map((c) => <li key={c.id} className="entry"><h2><a href={hrefs.detail(c.id)}>{c.title}</a></h2><p>{c.takeaway}</p></li>)}</ul>
    </section>
  </main>;
}
