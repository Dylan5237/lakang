import { cards } from '../data';
import type { Card, Stage } from '../types';
import { searchCards } from './search';
import type { UserState } from './storage';

export interface Filters {
  stage: Stage | 'all';
  topic: string | null;
  speakerId: string | null;
  favOnly: boolean;
  unreadOnly: boolean;
  query: string;
}

export const noFilters: Filters = { stage: 'all', topic: null, speakerId: null, favOnly: false, unreadOnly: false, query: '' };

export const isFiltered = (f: Filters) =>
  f.stage !== 'all' || f.topic !== null || f.speakerId !== null || f.favOnly || f.unreadOnly || f.query.trim() !== '';

export function applyFilters(f: Filters, user: Pick<UserState, 'favorites' | 'read'>, pool: Card[] = cards): Card[] {
  const out = pool.filter(
    (c) =>
      (f.stage === 'all' || c.stage === f.stage) &&
      (f.topic === null || c.topic === f.topic) &&
      (f.speakerId === null || c.speakerIds.includes(f.speakerId)) &&
      (!f.favOnly || user.favorites.includes(c.id)) &&
      (!f.unreadOnly || !user.read.includes(c.id)),
  );
  return f.query.trim() ? searchCards(f.query, out) : out;
}

export function startCard(list: Card[], user: Pick<UserState, 'read' | 'position'>): Card | undefined {
  if (!list.length) return undefined;
  const pos = list.find((c) => c.id === user.position);
  return pos ?? list.find((c) => !user.read.includes(c.id)) ?? list[0];
}

export const allTopics = (): string[] => [...new Set(cards.map((c) => c.topic))];
