import { useEffect, useState } from 'react';
import { cardsBySession, conference, sessions } from '../data';
import type { Session } from '../types';
import { dayKeys, defaultDay, sessionState, shanghaiClock, startOf, statusAt, venueChanged, weekdayLabel } from '../lib/agenda';
import { hrefs, navigate } from '../lib/router';
import { IconPin } from './Icons';

const days = dayKeys(sessions);
const dateOf = (day: number) => sessions.find((s) => s.day === day)!.date;
const md = (date: string) => date.slice(5).replace('-', '/');

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return now;
}

function Banner({ now }: { now: number }) {
  const st = statusAt(sessions, now);
  const when = (s: Session) => `${md(s.date)} ${s.start}`;
  let main: string;
  let sub = '';
  switch (st.phase) {
    case 'before':
      main = st.daysToStart === 0 ? '会议今天开始' : `距会议开始还有 ${st.daysToStart} 天`;
      sub = st.next ? `第一场：${when(st.next)} ${st.next.title}（${st.next.venue}）` : '';
      break;
    case 'during':
      main = `正在进行：${st.current.map((s) => s.title).join('、')}`;
      sub = `${st.current[0].venue}，${st.current[0].start}—${st.current[0].end}` + (st.next ? `；下一场 ${when(st.next)} ${st.next.title}` : '');
      break;
    case 'between':
      main = '场间休息';
      sub = st.next ? `下一场：${when(st.next)} ${st.next.title}（${st.next.venue}）` : '';
      break;
    default:
      main = '会议日程已结束';
      sub = `共 ${days.length} 天 ${sessions.length} 个区块；卡片与笔记仍可继续阅读。`;
  }
  return (
    <div className={`banner phase-${st.phase}`} role="status" data-testid="agenda-banner" data-phase={st.phase}>
      <strong>{main}</strong>
      {sub && <span>{sub}</span>}
      <small>现在是北京时间 {shanghaiClock(now)}；日程一律按北京时间（Asia/Shanghai），与设备所在时区无关。</small>
    </div>
  );
}

function SessionItem({ s, now, highlight }: { s: Session; now: number; highlight: boolean }) {
  const state = sessionState(s, now);
  const st = statusAt(sessions, now);
  const isNext = st.next?.id === s.id;
  const linked = cardsBySession.get(s.id) ?? [];
  const changed = venueChanged(sessions, s);
  return (
    <article id={`s-${s.id}`} className={`session ${state} ${highlight ? 'hl' : ''}`} data-session-id={s.id} data-state={state}>
      <div className="session-time">
        <time>
          {s.start}—{s.end}
        </time>
        {state === 'live' && <span className="badge live">进行中</span>}
        {state !== 'live' && isNext && <span className="badge next">下一场</span>}
        {state === 'past' && <span className="badge past">已结束</span>}
      </div>
      <h3>{s.title}</h3>
      {s.original && <p className="muted orig">{s.original}</p>}
      <p className="speaker">{s.speaker}</p>
      <p className="venue">
        <IconPin /> {s.venue}
        {changed && <span className="badge change">换场</span>}
      </p>
      {s.talks && (
        <ul className="talks">
          {s.talks.map((t) => (
            <li key={t.speakerId}>
              <strong>{t.title}</strong>
              <span className="muted"> {t.original}</span>
            </li>
          ))}
        </ul>
      )}
      {s.note && <p className="note-line">{s.note}</p>}
      {linked.length > 0 && (
        <details className="session-cards">
          <summary>相关知识卡 {linked.length}</summary>
          <ul className="link-list">
            {linked.map((c) => (
              <li key={c.id}>
                <a href={hrefs.card(c.id)}>{c.title}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

export function AgendaPage({ day, sessionId }: { day?: string; sessionId?: string }) {
  const now = useNow();
  const hlSession = sessionId ? sessions.find((s) => s.id === sessionId) : undefined;
  const view = day === 'all' ? 'all' : Number(day) && days.includes(Number(day)) ? Number(day) : hlSession ? hlSession.day : defaultDay(sessions, now);

  useEffect(() => {
    if (!sessionId) return;
    document.getElementById(`s-${sessionId}`)?.scrollIntoView({ block: 'center' });
  }, [sessionId, view]);

  const tab = (key: number | 'all', label: string, sub?: string) => (
    <button
      key={String(key)}
      type="button"
      role="tab"
      aria-selected={view === key}
      className={`tab ${view === key ? 'on' : ''}`}
      onClick={() => navigate(hrefs.agenda(String(key)), { replace: true })}
    >
      <span>{label}</span>
      {sub && <small>{sub}</small>}
    </button>
  );

  return (
    <main className="page agenda" data-testid="agenda">
      <header className="page-head">
        <h1>日程</h1>
        <p className="muted">
          {conference.name} · {conference.theme}
        </p>
        <p className="muted">{conference.location}</p>
      </header>
      <Banner now={now} />
      <div role="tablist" aria-label="按天查看" className="tabs">
        {days.map((d) => tab(d, `${d} 日`, weekdayLabel(dateOf(d))))}
        {tab('all', '总览', '五天')}
      </div>
      {view === 'all' ? (
        <div className="overview" data-testid="overview">
          {days.map((d) => (
            <section key={d} className="ov-day">
              <h2>
                <a href={hrefs.agenda(String(d))}>
                  {md(dateOf(d))} {weekdayLabel(dateOf(d))}
                </a>
              </h2>
              <ul>
                {sessions
                  .filter((s) => s.day === d)
                  .sort((a, b) => startOf(a) - startOf(b))
                  .map((s) => (
                    <li key={s.id} className={sessionState(s, now)}>
                      <a href={hrefs.agenda(String(d), s.id)}>
                        <time>
                          {s.start}—{s.end}
                        </time>
                        <span className="ov-title">{s.title}</span>
                        <span className="muted ov-venue">
                          {s.venue}
                          {venueChanged(sessions, s) ? ' · 换场' : ''}
                        </span>
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="day-list" data-testid="day-view">
          <h2 className="day-title">
            {md(dateOf(view))} {weekdayLabel(dateOf(view))}
          </h2>
          {sessions
            .filter((s) => s.day === view)
            .sort((a, b) => startOf(a) - startOf(b))
            .map((s) => (
              <SessionItem key={s.id} s={s} now={now} highlight={s.id === sessionId} />
            ))}
        </div>
      )}
    </main>
  );
}
