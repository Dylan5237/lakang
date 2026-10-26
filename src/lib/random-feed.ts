/** A shuffled, non-repeating deck per filter pool. Never mutates the editorial order. */
export const RANDOM_FEED_KEY = 'lakang:random-feed:v1';
const MAX_DECKS = 8;
export interface DeckStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
interface SavedDeck { key: string; ids: string[] }

export function shuffleIds(ids: readonly string[], random: () => number = Math.random): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createRandomFeed(storage: DeckStorage | null, random: () => number = Math.random) {
  let cache: SavedDeck[] = [];
  try {
    const raw: unknown = JSON.parse(storage?.getItem(RANDOM_FEED_KEY) ?? '[]');
    if (Array.isArray(raw)) cache = raw.filter((x): x is SavedDeck =>
      Boolean(x) && typeof x.key === 'string' && Array.isArray(x.ids) && x.ids.every((id: unknown) => typeof id === 'string'),
    ).slice(-MAX_DECKS);
  } catch { /* Corrupt or unavailable session storage must not block reading. */ }

  const keyFor = (ids: readonly string[], scope: string) => JSON.stringify([scope, [...ids].sort()]);
  const remember = (key: string, ids: string[]) => {
    cache = [...cache.filter((x) => x.key !== key), { key, ids: [...ids] }].slice(-MAX_DECKS);
    try { storage?.setItem(RANDOM_FEED_KEY, JSON.stringify(cache)); } catch { /* Keep the in-memory deck. */ }
    return [...ids];
  };
  const valid = (order: string[], pool: readonly string[]) =>
    order.length === pool.length && new Set(order).size === order.length && order.every((id) => pool.includes(id));

  return {
    get(ids: readonly string[], scope: string, preferred?: string | null): string[] {
      const key = keyFor(ids, scope);
      const saved = cache.find((x) => x.key === key);
      if (saved && valid(saved.ids, ids)) return [...saved.ids];
      const order = shuffleIds(ids, random);
      // A deliberate deep link or resume position stays first in a new deck.
      if (preferred && order.includes(preferred)) order.unshift(...order.splice(order.indexOf(preferred), 1));
      return remember(key, order);
    },
    renew(ids: readonly string[], scope: string, previous?: string): string[] {
      const order = shuffleIds(ids, random);
      // Avoid an immediate repeat at the round boundary (unless there is only one card).
      if (order.length > 1 && order[0] === previous) {
        const j = 1 + Math.floor(random() * (order.length - 1));
        [order[0], order[j]] = [order[j], order[0]];
      }
      return remember(keyFor(ids, scope), order);
    },
  };
}

let browserDeck: ReturnType<typeof createRandomFeed> | undefined;
export function randomFeed() {
  if (!browserDeck) {
    let storage: DeckStorage | null = null;
    try { storage = window.sessionStorage; } catch { /* Privacy mode: use memory only. */ }
    browserDeck = createRandomFeed(storage);
  }
  return browserDeck;
}
