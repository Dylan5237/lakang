import { studyCards, terms } from './study';

export interface ReviewItem { id: string; kind: 'term' | 'card'; front: string; sub: string; back: string }
export interface Sched { box: number; due: number; reps: number; lapses: number; first?: number }

/** Leitner-style boxes in days; box 0 is due immediately. */
export const BOX_DAYS = [0, 1, 3, 7, 16, 35, 70];
const DAY = 86_400_000;
const KEY = 'lakang:review';
/** Unseen cards introduced per day; reviews of seen cards are never capped. */
export const NEW_PER_DAY = 8;
const dayStart = (now: number) => Math.floor((now + 8 * 3_600_000) / DAY) * DAY - 8 * 3_600_000; // Asia/Shanghai midnight

/** Terms -> front/back; concept cards with a question -> question/answer. */
export function buildItems(): ReviewItem[] {
  const termItems: ReviewItem[] = terms.map((t) => ({
    id: `t:${t.id}`, kind: 'term', front: t.zh, sub: t.original, back: t.brief,
  }));
  const cardItems: ReviewItem[] = studyCards.filter((c) => c.question).map((c) => ({
    id: `c:${c.id}`, kind: 'card', front: c.question!, sub: c.topic, back: `《${c.title}》——${c.takeaway}`,
  }));
  return [...termItems, ...cardItems];
}

export function readSched(): Record<string, Sched> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (v && typeof v === 'object') {
      const out: Record<string, Sched> = {};
      for (const [k, s] of Object.entries(v as Record<string, unknown>)) {
        if (s && typeof s === 'object' && typeof (s as Sched).box === 'number') out[k] = s as Sched;
      }
      return out;
    }
  } catch { /* fall through */ }
  return {};
}
function writeSched(s: Record<string, Sched>): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

/** 0 = 忘了（回到第一格）、1 = 记得（升一格）、2 = 很熟（升两格）。 */
export function rate(id: string, q: 0 | 1 | 2, now = Date.now()): Record<string, Sched> {
  const all = readSched();
  const prev = all[id] ?? { box: 0, due: 0, reps: 0, lapses: 0 };
  const box = q === 0 ? 0 : Math.min(BOX_DAYS.length - 1, prev.box + q);
  all[id] = { box, due: now + BOX_DAYS[box] * DAY, reps: prev.reps + 1, lapses: prev.lapses + (q === 0 ? 1 : 0), first: prev.first ?? now };
  writeSched(all);
  return all;
}

export const isDue = (s: Sched | undefined, now = Date.now()) => !s || s.due <= now;

/** Seen cards that are due (longest overdue first), then unseen ones up to today's remaining new-card quota. */
function dueAndNew(items: ReviewItem[], sched: Record<string, Sched>, now: number) {
  const seen = items.filter((i) => sched[i.id] && isDue(sched[i.id], now)).sort((a, b) => sched[a.id].due - sched[b.id].due);
  const startedToday = Object.values(sched).filter((s) => s.first !== undefined && s.first >= dayStart(now)).length;
  const fresh = items.filter((i) => !sched[i.id]).slice(0, Math.max(0, NEW_PER_DAY - startedToday));
  return [...seen, ...fresh];
}

export function sessionQueue(items: ReviewItem[], sched: Record<string, Sched>, now = Date.now(), count = 12): ReviewItem[] {
  return dueAndNew(items, sched, now).slice(0, count);
}

export function dueCount(items: ReviewItem[], sched: Record<string, Sched>, now = Date.now()): number {
  return dueAndNew(items, sched, now).length;
}

export function masteredCount(sched: Record<string, Sched>): number {
  return Object.values(sched).filter((s) => s.box >= 4).length;
}
