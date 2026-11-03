import { useState } from 'react';
import { hrefs } from '../lib/router';
import type { Case, NoteCard, NoteLayer } from '../types';

const LONG = 140;
const plainLength = (html: string) => html.replace(/<[^>]+>/g, '').length;
const LAYER_LABEL: Record<NoteLayer, string> = { record: '原话摘要', said: '现场判断', editor: '编者延伸', glossary: '概念背景' };

function Refs({ c, refs }: { c: Case; refs: string[] }) {
  if (!refs.length) return null;
  return <p className="note-refs">{refs.map((id) => {
    const i = c.sections.findIndex((s) => s.id === id);
    return i < 0 ? null : <a key={id} href={hrefs.talk(c.id, id)} title={c.sections[i].title}>第 {i + 1} 节</a>;
  })}</p>;
}

function Card({ c, card }: { c: Case; card: NoteCard }) {
  const long = !card.quote && plainLength(card.html) > LONG;
  const [open, setOpen] = useState(!long);
  // html comes from scripts/build_clinical.py, which only emits <b>, <br>, <ul>, <li> and escapes all text.
  const body = <div className="note-body" dangerouslySetInnerHTML={{ __html: card.html }} />;
  if (card.quote) return <blockquote className="note quote">{body}<Refs c={c} refs={card.refs ?? []} /></blockquote>;
  return <article className={`note ${open ? 'open' : 'folded'}`}>
    {(card.tag || card.who) && <h3 className="note-tag">{card.who && <span className="note-who">{card.who}</span>}{card.tag}</h3>}
    {body}
    {long && <button type="button" className="note-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '收起' : '展开全文'}</button>}
    <Refs c={c} refs={card.refs ?? []} />
  </article>;
}

export function Notes({ c }: { c: Case }) {
  return <div className="notes" data-testid="notes">
    <section className="note-group"><h2>人物</h2>
      <ul className="legend">{c.legend.map((l, i) => <li key={i} className={l.role}><span className="dot" aria-hidden="true" />{l.text}</li>)}</ul>
    </section>
    {c.groups.map((g) => <section key={g.title} className={`note-group layer-${g.layer ?? 'record'}`} data-layer={g.layer ?? 'record'}>
      <h2>{g.title.replace(/^\p{Extended_Pictographic}️?\s*/u, '')}{g.layer && <span className="layer-badge">{LAYER_LABEL[g.layer]}</span>}</h2>
      {g.intro && <p className="note-intro">{g.intro}</p>}
      {g.cards.map((card, i) => <Card key={i} c={c} card={card} />)}
    </section>)}
  </div>;
}
