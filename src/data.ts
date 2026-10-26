import q from '../content/cards/01-question.json';
import c from '../content/cards/02-concept.json';
import h from '../content/cards/03-history.json';
import s from '../content/cards/04-speakers.json';
import t from '../content/cards/05-themes.json';
import k from '../content/cards/06-clinic.json';
import desire from '../content/cards/07-desire.json';
import body from '../content/cards/08-body.json';
import symptom from '../content/cards/09-symptom.json';
import speech from '../content/cards/10-speech.json';
import culture from '../content/cards/11-culture.json';
import reading from '../content/cards/12-reading.json';
import readingOrder from '../content/reading-order.json';
import agendaJson from '../content/agenda.json';
import sourcesJson from '../content/sources.json';
import additionalSources from '../content/sources-extension.json';
import speakersJson from '../content/speakers.json';
import termsJson from '../content/terms.json';
import additionalTerms from '../content/terms-extension.json';
import shelfJson from '../content/shelf.json';
import seriesJson from '../content/series.json';
import type { Book, Card, Session, Source, Speaker, Term } from './types';

const rawCards = [q, c, h, s, t, k, desire, body, symptom, speech, culture, reading].flat() as unknown as Card[];
// Additional glossary entries carry explicit card links; merge them without changing existing IDs.
const contentCards = rawCards.map((card) => ({ ...card, termIds: [...new Set([
  ...(card.termIds ?? []),
  ...additionalTerms.filter((term) => term.cardIds.includes(card.id)).map((term) => term.id),
])] }));
const contentById = new Map(contentCards.map((card) => [card.id, card]));
if (contentById.size !== contentCards.length || new Set(readingOrder).size !== readingOrder.length || readingOrder.length !== contentCards.length || readingOrder.some((id) => !contentById.has(id))) {
  throw new Error('Reading order must contain every card exactly once.');
}
export const cards: Card[] = readingOrder.map((id) => contentById.get(id)!);
export const sessions = agendaJson.sessions as unknown as Session[];
export const sources = [...sourcesJson.sources, ...additionalSources] as Source[];
export const speakers = speakersJson as Speaker[];
export const terms = [...termsJson, ...additionalTerms] as Term[];
export const shelf = shelfJson as Book[];
export const series = seriesJson;
export const conference = { name: agendaJson.conference, theme: agendaJson.theme, location: agendaJson.location, timezone: agendaJson.timezone };
export const cardById = new Map(cards.map((x) => [x.id, x]));
export const sessionById = new Map(sessions.map((x) => [x.id, x]));
export const sourceById = new Map(sources.map((x) => [x.id, x]));
export const speakerById = new Map(speakers.map((x) => [x.id, x]));
export const termById = new Map(terms.map((x) => [x.id, x]));
export const seriesByCard = new Map<string, (typeof series)[number]>();
for (const item of series) {
  for (const id of item.cardIds) {
    if (!cardById.has(id) || seriesByCard.has(id)) throw new Error(`Invalid series card: ${id}`);
    seriesByCard.set(id, item);
  }
}
export const cardsBySession = new Map<string, Card[]>();
for (const card of cards) {
  for (const sid of card.sessionIds) {
    const arr = cardsBySession.get(sid) ?? [];
    arr.push(card);
    cardsBySession.set(sid, arr);
  }
}
