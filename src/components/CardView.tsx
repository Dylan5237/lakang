import { memo } from 'react';
import { sessionById } from '../data';
import { STAGES, type Card } from '../types';
import { hrefs, navigate } from '../lib/router';
import { actions } from '../lib/store';
import { Rich } from './Rich';
import { Figure } from './Figure';
import { IconCheck, IconNote, IconStar } from './Icons';

interface Props {
  card: Card;
  index: number;
  total: number;
  fav: boolean;
  read: boolean;
  hasNote: boolean;
}

const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

function CardViewBase({ card, index, total, fav, read, hasNote }: Props) {
  const linked = card.sessionIds.map((id) => sessionById.get(id)).filter((s) => s !== undefined);
  return (
    <section className="card" data-card-id={card.id} aria-label={`第 ${index + 1} 张，共 ${total} 张：${card.title}`}>
      <div className="card-inner">
        <div className="card-meta">
          <span className="chip-stage">{stageLabel(card.stage)}</span>
          <span className="chip-topic">{card.topic}</span>
          {card.fictional && <span className="chip-tag">虚构示例</span>}
          <span className="card-count">
            {index + 1} / {total}
          </span>
        </div>
        <h2 className="card-title">{card.title}</h2>
        <Rich className="card-body" text={card.body} />
        {card.figure && <Figure figure={card.figure} />}
        <p className="takeaway">{card.takeaway}</p>
        {linked.length > 0 && (
          <p className="card-sessions">
            <span>关联日程</span>
            {linked.slice(0, 2).map((s) => (
              <a key={s.id} href={hrefs.agenda(String(s.day), s.id)}>
                {s.date.slice(5).replace('-', '/')} {s.start}
              </a>
            ))}
            {linked.length > 2 && <a href={hrefs.detail(card.id)} onClick={(e) => { e.preventDefault(); navigate(hrefs.detail(card.id)); }}>等 {linked.length} 场</a>}
          </p>
        )}
      </div>
      <div className="actions" role="group" aria-label="卡片操作">
        <button type="button" className={`act ${fav ? 'on' : ''}`} aria-pressed={fav} onClick={() => actions.toggleFavorite(card.id)}>
          <IconStar filled={fav} />
          <span>{fav ? '已收藏' : '收藏'}</span>
        </button>
        <button type="button" className={`act ${read ? 'on' : ''}`} aria-pressed={read} onClick={() => actions.toggleRead(card.id)}>
          <IconCheck filled={read} />
          <span>{read ? '已读' : '标已读'}</span>
        </button>
        <button type="button" className={`act ${hasNote ? 'on' : ''}`} onClick={() => navigate(hrefs.detail(card.id))}>
          <IconNote />
          <span>{hasNote ? '有笔记' : '笔记'}</span>
        </button>
        <button type="button" className="act primary" onClick={() => navigate(hrefs.detail(card.id))}>
          <span>展开读</span>
        </button>
      </div>
    </section>
  );
}

export const CardView = memo(CardViewBase);
