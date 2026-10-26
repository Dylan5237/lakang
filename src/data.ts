import q from '../content/cards/01-question.json';
import c from '../content/cards/02-concept.json';
import h from '../content/cards/03-history.json';
import s from '../content/cards/04-speakers.json';
import t from '../content/cards/05-themes.json';
import k from '../content/cards/06-clinic.json';
import agendaJson from '../content/agenda.json';
import sourcesJson from '../content/sources.json';
import speakersJson from '../content/speakers.json';
import termsJson from '../content/terms.json';
import shelfJson from '../content/shelf.json';
import type { Book, Card, Session, Source, Speaker, Term } from './types';

export const cards = [q, c, h, s, t, k].flat() as unknown as Card[];
export const sessions = agendaJson.sessions as unknown as Session[];
export const sources = sourcesJson.sources as Source[];
export const speakers = speakersJson as Speaker[];
export const terms = termsJson as Term[];
export const shelf = shelfJson as Book[];
export const conference = {
  name: agendaJson.conference,
  theme: agendaJson.theme,
  location: agendaJson.location,
  timezone: agendaJson.timezone,
};

export const cardById = new Map(cards.map((x) => [x.id, x]));
export const sessionById = new Map(sessions.map((x) => [x.id, x]));
export const sourceById = new Map(sources.map((x) => [x.id, x]));
export const speakerById = new Map(speakers.map((x) => [x.id, x]));
export const termById = new Map(terms.map((x) => [x.id, x]));

export const cardsBySession = new Map<string, Card[]>();
for (const card of cards) {
  for (const sid of card.sessionIds) {
    const arr = cardsBySession.get(sid) ?? [];
    arr.push(card);
    cardsBySession.set(sid, arr);
  }
}
