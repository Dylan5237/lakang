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
import official from '../content/cards/13-official.json';
import readingOrder from '../content/reading-order.json';
import retiredIds from '../content/retired-card-ids.json';
import agendaJson from '../content/agenda.json';
import sourcesJson from '../content/sources.json';
import additionalSources from '../content/sources-extension.json';
import speakersJson from '../content/speakers.json';
import termsJson from '../content/terms.json';
import additionalTerms from '../content/terms-extension.json';
import shelfJson from '../content/shelf.json';
import seriesJson from '../content/series.json';
import p01 from '../content/official/P01.json';
import p02 from '../content/official/P02.json';
import p03 from '../content/official/P03.json';
import p04 from '../content/official/P04.json';
import pdfRegistry from '../content/official/pdf-registry.json';
import type { Book, Card, OfficialArticle, Session, Source, Speaker, Term } from './types';

export const officialArticles = [p01, p02, p03, p04] as OfficialArticle[];
export const officialArticleById = new Map(officialArticles.map((a) => [a.id, a]));
export const officialPdfs = pdfRegistry as Record<string, string>;
const rawCards = [q, c, h, s, t, k, desire, body, symptom, speech, culture, reading, official].flat() as unknown as Card[];
// IDs are never recycled: archived cards remain resolvable for old links, notes and backups.
export const allCards: Card[] = rawCards.map((card) => ({ ...card, termIds: [...new Set([
  ...(card.termIds ?? []), ...additionalTerms.filter((term) => term.cardIds.includes(card.id)).map((term) => term.id),
])] }));
export const cardById = new Map(allCards.map((card) => [card.id, card]));
export const retiredCardIds = new Set<string>(retiredIds);
export const activeCardIds = new Set<string>(readingOrder);
if (cardById.size !== allCards.length || activeCardIds.size !== readingOrder.length || retiredCardIds.size !== retiredIds.length ||
    readingOrder.some((id) => !cardById.has(id) || retiredCardIds.has(id)) || retiredIds.some((id) => !cardById.has(id)) ||
    readingOrder.length + retiredIds.length !== allCards.length) {
  throw new Error('Active order and archive must form a complete disjoint partition of stable card IDs.');
}
export const cards = readingOrder.map((id) => cardById.get(id)!);
export const retiredCards = retiredIds.map((id) => cardById.get(id)!);
export const sessions = agendaJson.sessions as unknown as Session[];
const officialSources: Source[] = officialArticles.map((a) => ({
  id: a.sourceId, title: a.fullTitle, publisher: `${a.publisher} · 前瞻署名：${a.byline}`, date: a.publishedAt,
  url: `https://github.com/Dylan5237/lakang/blob/main/content/official/${a.id}.json`, officialArticleId: a.id,
  editorialScope: '用户提供的官方前瞻PDF。正文按原文转录；卡片保留理论归属、病例时间及问句，不补写未公开讲稿。',
}));
export const sources = [...sourcesJson.sources, ...additionalSources, ...officialSources] as Source[];
export const speakers = speakersJson as Speaker[];
export const terms = [...termsJson, ...additionalTerms] as Term[];
export const shelf = shelfJson as Book[];
export const series = seriesJson;
export const conference = { name: agendaJson.conference, theme: agendaJson.theme, location: agendaJson.location, timezone: agendaJson.timezone };
export const sessionById = new Map(sessions.map((x) => [x.id, x]));
export const sourceById = new Map(sources.map((x) => [x.id, x]));
export const speakerById = new Map(speakers.map((x) => [x.id, x]));
export const termById = new Map(terms.map((x) => [x.id, x]));
export const seriesByCard = new Map<string, (typeof series)[number]>();
for (const item of series) for (const id of item.cardIds) {
  if (!activeCardIds.has(id) || seriesByCard.has(id)) throw new Error(`Invalid series card: ${id}`);
  seriesByCard.set(id, item);
}
export const officialArticleByCard = new Map<string, OfficialArticle>();
for (const a of officialArticles) for (const id of a.cardIds) {
  const card = cardById.get(id);
  if (!activeCardIds.has(id) || card?.officialArticleId !== a.id || officialArticleByCard.has(id)) throw new Error(`Invalid official card: ${id}`);
  if (!card.evidenceIds?.length || card.evidenceIds.some((pid) => !a.paragraphs.some((p) => p.id === pid))) throw new Error(`Invalid original locator: ${id}`);
  officialArticleByCard.set(id, a);
}
export const cardsBySession = new Map<string, Card[]>();
for (const session of sessions) {
  const active = cards.filter((card) => card.sessionIds.includes(session.id));
  // Administrative events can link to the appendix without putting logistics back in the main feed.
  cardsBySession.set(session.id, active.length ? active : retiredCards.filter((card) => card.sessionIds.includes(session.id)));
}
