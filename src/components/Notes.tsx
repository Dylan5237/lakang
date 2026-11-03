import { useState } from 'react';
import type { Case, NoteCard } from '../types';

const LONG = 140;
const plainLength = (html: string) => html.replace(/<[^>]+>/g, '').length;

function Card({ card }: { card: NoteCard }) {
  const long = !card.quote && plainLength(card.html) > LONG;
  const [open, setOpen] = useState(!long);
  // html comes from scripts/build_clinical.py, which only emits <b>, <br>, <ul>, <li> and escapes all text.
  const body = <div className="note-body" dangerouslySetInnerHTML={{ __html: card.html }} />;
  if (card.quote) return <blockquote className="note quote">{body}</blockquote>;
  return <article className={`note ${open ? 'open' : 'folded'}`}>
    {card.tag && <h3 className="note-tag">{card.tag}</h3>}
    {body}
    {long && <button type="button" className="note-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起' : '展开全文'}</button>}
  </article>;
}

export function Notes({ c }: { c: Case }) {
  return <div className="notes" data-testid="notes">
    <section className="note-group"><h2>人物</h2>
      <ul className="legend">{c.legend.map((l, i) => <li key={i} className={l.role}><span className="dot" aria-hidden="true" />{l.text}</li>)}</ul>
    </section>
    {c.groups.map((g) => <section key={g.title} className="note-group"><h2>{g.title.replace(/^\p{Extended_Pictographic}️?\s*/u, '')}</h2>
      {g.cards.map((card, i) => <Card key={i} card={card} />)}
    </section>)}
  </div>;
}
