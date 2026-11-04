import { afterEach, describe, expect, it, vi } from 'vitest';

// localStorage stub for the node environment
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

const { NEW_PER_DAY, buildItems, dueCount, rate, readSched, sessionQueue } = await import('../src/lib/review');
const DAY = 86_400_000;

describe('闪卡排期', () => {
  afterEach(() => store.clear());

  it('题组由术语与带问题的概念卡组成，不含无问题的卡', () => {
    const items = buildItems();
    expect(items.filter((i) => i.kind === 'term').length).toBeGreaterThan(20);
    expect(items.filter((i) => i.kind === 'card').length).toBeGreaterThan(0);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('忘了回到第一格并立即到期；记得/很熟升格并按箱距到期', () => {
    const t0 = 1_000_000_000_000;
    rate('t:T01', 1, t0);
    expect(readSched()['t:T01']).toMatchObject({ box: 1, reps: 1, lapses: 0 });
    rate('t:T01', 2, t0);
    expect(readSched()['t:T01'].box).toBe(3);
    rate('t:T01', 0, t0);
    expect(readSched()['t:T01']).toMatchObject({ box: 0, due: t0, reps: 3, lapses: 1 });
    rate('t:T02', 1, t0);
    expect(readSched()['t:T02'].due).toBe(t0 + 1 * DAY);
  });

  it('当天新卡配额用完后不再出新卡，次日恢复；已见到期的卡不受限', () => {
    const items = buildItems();
    const t0 = 5 * DAY;
    items.slice(0, NEW_PER_DAY).forEach((i) => rate(i.id, 0, t0)); // forgotten: due again right away
    expect(dueCount(items, readSched(), t0)).toBe(NEW_PER_DAY); // only the seen ones, no extra new
    expect(dueCount(items, readSched(), t0 + DAY)).toBe(NEW_PER_DAY * 2); // next day: new quota refills
  });

  it('到期与未见的卡进入队列，按最早到期排序，封顶数量', () => {
    const items = buildItems();
    expect(dueCount(items, {}, 0)).toBe(NEW_PER_DAY); // unseen cards are rationed per day
    rate('t:T01', 1, 0); // due at 1day
    rate('t:T02', 0, 0); // due now
    const q = sessionQueue(items, readSched(), DAY / 2, 10);
    expect(q.map((i) => i.id)).toContain('t:T02');
    expect(q.map((i) => i.id)).not.toContain('t:T01'); // not yet due
    expect(sessionQueue(items, readSched(), DAY / 2, 1)).toHaveLength(1);
  });
});
