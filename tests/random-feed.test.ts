import { describe, expect, it } from 'vitest';
import { createRandomFeed, RANDOM_FEED_KEY, shuffleIds, type DeckStorage } from '../src/lib/random-feed';
const storage = (): DeckStorage => {
  const values = new Map<string, string>();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => { values.set(k, v); } };
};
const pool = ['A', 'B', 'C', 'D'];
describe('随机刷卡队列', () => {
  it('洗牌不修改输入；一轮完整、无重复，不按原顺序', () => {
    expect(shuffleIds(pool, () => 0)).toEqual(['B', 'C', 'D', 'A']);
    expect(pool).toEqual(['A', 'B', 'C', 'D']);
    const ids = Array.from({ length: 100 }, (_, i) => `K${i}`);
    const actual = shuffleIds(ids, () => 0.37);
    expect(new Set(actual).size).toBe(100);
    expect([...actual].sort()).toEqual([...ids].sort());
  });
  it('不同随机输入可以产生不同排列', () => {
    expect(shuffleIds(pool, () => 0)).not.toEqual(shuffleIds(pool, () => 0.9));
  });
  it('重复渲染和当前卡变化不重排；返回使用同一队列', () => {
    const deck = createRandomFeed(null, () => 0);
    const first = deck.get(pool, 'all');
    expect(deck.get(pool, 'all', 'D')).toEqual(first);
    first.reverse();
    expect(deck.get(pool, 'all')).toEqual(['B', 'C', 'D', 'A']);
  });
  it('刷新后恢复同一标签页队列', () => {
    const s = storage();
    const first = createRandomFeed(s, () => 0).get(pool, 'all');
    expect(createRandomFeed(s, () => 0.9).get(pool, 'all')).toEqual(first);
  });
  it('新队列保留指定深链或上次阅读位置，其他卡仍随机', () => {
    expect(createRandomFeed(null, () => 0).get(pool, 'all', 'D')).toEqual(['D', 'B', 'C', 'A']);
    expect(createRandomFeed(null, () => 0).get(pool, 'all', 'missing')).toEqual(['B', 'C', 'D', 'A']);
  });
  it('筛选队列相互隔离且不越界，回原筛选恢复原序', () => {
    const deck = createRandomFeed(null, () => 0);
    const all = deck.get(pool, 'all');
    expect(deck.get(['A', 'D'], 'favorites')).toEqual(['D', 'A']);
    expect(deck.get(pool, 'all')).toEqual(all);
  });
  it('内容增删后不用旧队列，支持空集和单卡', () => {
    const deck = createRandomFeed(null, () => 0);
    deck.get(pool, 'all');
    expect(deck.get(['A', 'E'], 'all').sort()).toEqual(['A', 'E']);
    expect(deck.get([], 'empty')).toEqual([]);
    expect(deck.get(['A'], 'single')).toEqual(['A']);
    expect(deck.renew(['A'], 'single', 'A')).toEqual(['A']);
  });
  it('新一轮不会立即重复上一轮最后一张', () => {
    const deck = createRandomFeed(null, () => 0);
    const next = deck.renew(pool, 'all', 'B');
    expect(next[0]).not.toBe('B');
    expect([...next].sort()).toEqual(pool);
    expect(deck.get(pool, 'all')).toEqual(next);
  });
  it('损坏／重复的缓存与存储禁用不阻断刷卡', () => {
    const s = storage();
    s.setItem(RANDOM_FEED_KEY, 'bad-json');
    expect(createRandomFeed(s, () => 0).get(pool, 'all')).toEqual(['B', 'C', 'D', 'A']);
    s.setItem(RANDOM_FEED_KEY, JSON.stringify([{ key: JSON.stringify(['all', pool]), ids: ['A', 'A', 'C', 'D'] }]));
    expect(new Set(createRandomFeed(s, () => 0).get(pool, 'all')).size).toBe(4);
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); } };
    const deck = createRandomFeed(blocked, () => 0);
    expect(deck.get(pool, 'all')).toEqual(deck.get(pool, 'all'));
  });
  it('缓存有界，不向localStorage写入或收集笔记', () => {
    const s = storage(); const deck = createRandomFeed(s, () => 0);
    for (let i = 0; i < 20; i++) deck.get(pool, `filter-${i}`);
    expect(JSON.parse(s.getItem(RANDOM_FEED_KEY)!)).toHaveLength(8);
  });
});
