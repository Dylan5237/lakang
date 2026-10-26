import { useEffect, useRef } from 'react';
import { cardById, officialArticles, sessionById, sourceById, speakerById, termById } from '../data';
import { STAGES, type Card } from '../types';
import { closeDetail, hrefs, navigate } from '../lib/router';
import { actions, useUser } from '../lib/store';
import { NOTE_MAX } from '../lib/storage';
import { Rich } from './Rich';
import { Figure } from './Figure';
import { Sheet } from './Sheet';
import { SeriesNav } from './StudyPaths';
import { CardOrigin, OfficialSequence } from './OfficialLinks';
import { IconCheck, IconExternal, IconStar } from './Icons';
export function DetailDialog({ card }: { card: Card | undefined }) {
  const user = useUser();
  return <Sheet open={card !== undefined} title={card?.title ?? '详情'} onRequestClose={() => card && closeDetail(card.id)} className="detail" testId="detail">{card && <DetailBody card={card} fav={user.favorites.includes(card.id)} read={user.read.includes(card.id)} note={user.notes[card.id] ?? ''} />}</Sheet>;
}
function DetailBody({ card, fav, read, note }: { card: Card; fav: boolean; read: boolean; note: string }) {
  const article = useRef<HTMLElement>(null);
  useEffect(() => { article.current?.closest('.sheet-scroll')?.scrollTo({ top: 0, behavior: 'instant' }); }, [card.id]);
  const stage = STAGES.find((s) => s.id === card.stage)?.label;
  const sessions = card.sessionIds.map((id) => sessionById.get(id)).filter((s) => s !== undefined);
  const spk = card.speakerIds.map((id) => speakerById.get(id)).filter((s) => s !== undefined);
  const trm = (card.termIds ?? []).map((id) => termById.get(id)).filter((t) => t !== undefined);
  const related = card.relatedCardIds.map((id) => cardById.get(id)).filter((c) => c !== undefined);
  const previews = card.officialArticleId ? [] : officialArticles.filter((a) => card.speakerIds.includes(a.speakerId));
  const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); navigate(href); };
  return <article className="detail-body" ref={article}>
    <div className="card-meta"><span className="chip-stage">{stage}</span><span className="chip-topic">{card.topic}</span>{card.fictional && <span className="chip-tag">虚构示例</span>}</div>
    <CardOrigin card={card} /><Rich className="card-body" text={card.body} />{card.figure && <Figure figure={card.figure} credit />}<p className="takeaway">{card.takeaway}</p>
    {card.detail.length > 0 && <Rich className="detail-text" text={card.detail.join('\n')} />}<OfficialSequence cardId={card.id} /><SeriesNav cardId={card.id} />
    {previews.length > 0 && <section><h3>讲者的官方前瞻</h3><ul className="link-list">{previews.map((a) => <li key={a.id}><a href={hrefs.previews(a.id)} onClick={go(hrefs.previews(a.id))}>{a.title}</a></li>)}</ul></section>}
    {card.question && <section className="callout"><h3>带进会场的问题</h3><p>{card.question}</p></section>}{card.action && <section className="callout"><h3>会前做一步</h3><p>{card.action}</p></section>}
    <div className="detail-actions"><button type="button" className={`btn ${fav ? 'on' : ''}`} aria-pressed={fav} onClick={() => actions.toggleFavorite(card.id)}><IconStar filled={fav} width={18} height={18} /> {fav ? '已收藏' : '收藏'}</button><button type="button" className={`btn ${read ? 'on' : ''}`} aria-pressed={read} onClick={() => actions.toggleRead(card.id)}><IconCheck filled={read} width={18} height={18} /> {read ? '已读' : '标为已读'}</button></div>
    <section><h3>我的笔记</h3><textarea className="note" value={note} maxLength={NOTE_MAX} rows={4} placeholder="只写自己的理解与待核对的问题；不要记录真实个案信息。" aria-label="我的笔记" onChange={(e) => actions.setNote(card.id, e.target.value)} /><p className="hint">仅保存在本机浏览器。</p></section>
    {sessions.length > 0 && <section><h3>关联日程</h3><ul className="link-list">{sessions.map((s) => <li key={s.id}><a href={hrefs.agenda(String(s.day), s.id)} onClick={go(hrefs.agenda(String(s.day), s.id))}>{s.date.slice(5).replace('-', '/')} {s.start}—{s.end} · {s.title}</a></li>)}</ul></section>}
    {spk.length > 0 && <section><h3>相关讲者</h3><ul className="link-list">{spk.map((s) => <li key={s.id}><a href={hrefs.card(s.cardId)} onClick={go(hrefs.card(s.cardId))}>{s.name}</a><span className="muted"> · {s.thread}</span></li>)}</ul></section>}
    {trm.length > 0 && <section><h3>{card.officialArticleId ? '相关背景术语' : '术语'}</h3><dl className="terms">{trm.map((t) => <div key={t.id}><dt>{t.zh} <span className="muted">{t.original}</span></dt><dd>{t.text}</dd></div>)}</dl></section>}
    {related.length > 0 && <section><h3>接着读</h3><ul className="link-list">{related.map((c) => <li key={c.id}><a href={hrefs.card(c.id)} onClick={go(hrefs.card(c.id))}>{c.title}</a></li>)}</ul></section>}
    <section data-testid="sources"><h3>出处与定位</h3><ul className="sources">{card.sourceIds.map((id) => {
      const s = sourceById.get(id); if (!s) return null;
      const internal = s.officialArticleId ? hrefs.original(s.officialArticleId, card.evidenceIds?.[0]) : undefined;
      return <li key={id}>{internal ? <a href={internal} onClick={go(internal)}>{s.title} · 站内读原文</a> : <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <IconExternal /></a>}<div className="muted">{id} · {s.publisher} · {s.date}</div>{card.locators?.[id] && <div className="loc">定位：{card.locators[id]}</div>}</li>;
    })}</ul></section>
  </article>;
}
