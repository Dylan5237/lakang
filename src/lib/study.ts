import cardsJson from '../../content/cards.json' with { type: 'json' };
import orderJson from '../../content/card-order.json' with { type: 'json' };
import termsJson from '../../content/terms.json' with { type: 'json' };
import sourcesJson from '../../content/sources.json' with { type: 'json' };
import pathsJson from '../../content/paths.json' with { type: 'json' };
// JSON infers per-object literal types; the content pipeline (unit-tested) guarantees the shape.
import type { StudyCard, StudyPath, StudySource, Term } from '../types';

export const studyCards = cardsJson as unknown as StudyCard[];
export const cardOrder = orderJson as string[];
export const terms = termsJson as unknown as Term[];
export const studySources = sourcesJson as unknown as StudySource[];
export const paths = pathsJson as unknown as StudyPath[];
export const cardById = new Map(studyCards.map((c) => [c.id, c]));
export const termById = new Map(terms.map((t) => [t.id, t]));
export const sourceById = new Map(studySources.map((s) => [s.id, s]));
export const pathById = new Map(paths.map((p) => [p.id, p]));
export const cardsByTerm = (termId: string) => studyCards.filter((c) => c.termIds.includes(termId));

/** Only progress data is stored locally (ids, never content). */
const KEY = 'lakang:cards';
export interface CardProgress { favorites: string[]; read: string[]; position: string | null }
const EMPTY: CardProgress = { favorites: [], read: [], position: null };

export function readProgress(): CardProgress {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (v && typeof v === 'object' && Array.isArray(v.favorites) && Array.isArray(v.read)) {
      return { favorites: v.favorites.filter((x: unknown) => typeof x === 'string'), read: v.read.filter((x: unknown) => typeof x === 'string'), position: typeof v.position === 'string' ? v.position : null };
    }
  } catch { /* fall through */ }
  return EMPTY;
}
export function writeProgress(p: CardProgress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ }
}
export function toggleFavorite(id: string): CardProgress {
  const p = readProgress();
  const next = { ...p, favorites: p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id] };
  writeProgress(next); return next;
}
export function visitCard(id: string): CardProgress {
  const p = readProgress();
  const next = { favorites: p.favorites, read: p.read.includes(id) ? p.read : [...p.read, id], position: id };
  if (next.read === p.read && next.position === p.position) return p;
  writeProgress(next); return next;
}

/** Split plain text so existing K### mentions link to their cards; others stay text. */
export function splitLinks(text: string): { text: string; cardId?: string }[] {
  const out: { text: string; cardId?: string }[] = [];
  for (const part of text.split(/(K\d{3})/g)) {
    if (!part) continue;
    if (/^K\d{3}$/.test(part) && cardById.has(part)) out.push({ text: part, cardId: part });
    else if (out.length && !out[out.length - 1].cardId) out[out.length - 1].text += part;
    else out.push({ text: part });
  }
  return out;
}
