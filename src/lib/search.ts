import { cards, speakers, terms } from '../data';
import type { Card } from '../types';

const norm = (s: string) => s.normalize('NFKC').toLowerCase();

interface Entry {
  card: Card;
  title: string;
  topic: string;
  takeaway: string;
  body: string;
  rest: string;
}

const index: Entry[] = cards.map((card) => {
  const spk = card.speakerIds
    .map((id) => speakers.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => `${s!.name} ${s!.original}`)
    .join(' ');
  const trm = (card.termIds ?? [])
    .map((id) => terms.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => `${t!.zh} ${t!.original}`)
    .join(' ');
  return {
    card,
    title: norm(card.title),
    topic: norm(card.topic),
    takeaway: norm(card.takeaway),
    body: norm(card.body),
    rest: norm([...card.detail, card.question ?? '', card.action ?? '', spk, trm, card.id].join('\n')),
  };
});

export function searchCards(query: string, pool: Card[] = cards): Card[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return pool;
  const allowed = new Set(pool.map((c) => c.id));
  const scored: { card: Card; score: number; order: number }[] = [];
  index.forEach((e, order) => {
    if (!allowed.has(e.card.id)) return;
    let total = 0;
    for (const t of tokens) {
      let s = 0;
      if (e.title.includes(t)) s += 6;
      if (e.topic.includes(t)) s += 4;
      if (e.takeaway.includes(t)) s += 3;
      if (e.body.includes(t)) s += 2;
      if (e.rest.includes(t)) s += 1;
      if (!s) return;
      total += s;
    }
    scored.push({ card: e.card, score: total, order });
  });
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((x) => x.card);
}

export function snippet(card: Card, query: string, len = 44): string {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  const text = card.body.replace(/\s+/g, ' ');
  const low = norm(text);
  for (const t of tokens) {
    const i = low.indexOf(t);
    if (i >= 0) {
      const start = Math.max(0, i - 10);
      return (start > 0 ? '…' : '') + text.slice(start, start + len) + '…';
    }
  }
  return card.takeaway;
}
