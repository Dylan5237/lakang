/** Daily habit: dates and ids only, kept on this device. Dates are Asia/Shanghai calendar days. */
const KEY = 'lakang:habit';
export const DAILY_GOAL = 3;
interface Habit { days: string[]; today: string; cards: string[]; reviews: number }

const dayOf = (t: number) => new Date(t + 8 * 3600e3).toISOString().slice(0, 10);
export const todayStr = () => dayOf(Date.now());

function read(): Habit {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (v && Array.isArray(v.days) && Array.isArray(v.cards) && typeof v.today === 'string') {
      const h: Habit = { days: v.days.filter((x: unknown) => typeof x === 'string'), today: v.today, cards: v.cards.filter((x: unknown) => typeof x === 'string'), reviews: Number(v.reviews) || 0 };
      return h.today === todayStr() ? h : { ...h, today: todayStr(), cards: [], reviews: 0 };
    }
  } catch { /* fall through */ }
  return { days: [], today: todayStr(), cards: [], reviews: 0 };
}
function write(h: Habit) { try { localStorage.setItem(KEY, JSON.stringify({ ...h, days: h.days.slice(-120) })); } catch { /* storage blocked */ } }
const stamp = (h: Habit) => (h.days.includes(h.today) ? h.days : [...h.days, h.today]);

export function markCard(id: string): void {
  const h = read();
  if (h.cards.includes(id)) return;
  write({ ...h, cards: [...h.cards, id], days: stamp(h) });
}
export function markReview(): void { const h = read(); write({ ...h, reviews: h.reviews + 1, days: stamp(h) }); }

/** Consecutive study days ending today; a streak not yet continued today still counts from yesterday. */
export function streakOf(days: string[], today: string): number {
  const set = new Set(days);
  let t = Date.parse(`${today}T00:00:00Z`);
  if (!set.has(today)) t -= 86400e3;
  let n = 0;
  while (set.has(dayOf(t))) { n++; t -= 86400e3; }
  return n;
}
export function readHabit() { const h = read(); return { cardsToday: h.cards.length, reviewsToday: h.reviews, streak: streakOf(h.days, h.today) }; }
