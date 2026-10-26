import { describe, expect, it } from 'vitest';
import { cards } from '../src/data';
import { applyFilters, isFiltered, noFilters, startCard } from '../src/lib/filter';
import readingOrder from '../content/reading-order.json';

const user = { favorites: ['K003', 'K010'], read: ['K001', 'K002'], position: null as string | null };

describe('筛选与起始卡', () => {
  it('默认不筛选，按显式学习路径排序，保留所有卡片', () => {
    expect(isFiltered(noFilters)).toBe(false);
    const list = applyFilters(noFilters, user);
    expect(list).toHaveLength(cards.length);
    expect(list.map((c) => c.id)).toEqual(readingOrder);
    expect(new Set(list.map((c) => c.id)).size).toBe(cards.length);
  });
  it('按阶段/主题/讲者/收藏/未读组合筛选，保留相对阅读顺序', () => {
    const concepts = applyFilters({ ...noFilters, stage: 'concept' }, user);
    expect(concepts.every((c) => c.stage === 'concept')).toBe(true);
    expect(concepts.map((c) => c.id)).toEqual(cards.filter((c) => c.stage === 'concept').map((c) => c.id));
    expect(applyFilters({ ...noFilters, favOnly: true }, user).map((c) => c.id)).toEqual(['K003', 'K010']);
    expect(applyFilters({ ...noFilters, unreadOnly: true }, user).some((c) => c.id === 'K001')).toBe(false);
    const sp = applyFilters({ ...noFilters, speakerId: 'expert-luc' }, user);
    expect(sp.length).toBeGreaterThan(0);
    expect(sp.every((c) => c.speakerIds.includes('expert-luc'))).toBe(true);
    const topic = cards[7].topic;
    expect(applyFilters({ ...noFilters, topic }, user).every((c) => c.topic === topic)).toBe(true);
    expect(applyFilters({ ...noFilters, stage: 'clinic', query: '糖肽' }, user)).toEqual([]);
  });
  it('起始卡：有上次位置则回到位置，否则第一张未读，全部已读则第一张', () => {
    const list = applyFilters(noFilters, user);
    expect(startCard(list, { read: user.read, position: 'K020' })?.id).toBe('K020');
    expect(startCard(list, { read: user.read, position: null })?.id).toBe('K003');
    expect(startCard(list, { read: list.map((c) => c.id), position: null })?.id).toBe('K001');
    expect(startCard(list, { read: user.read, position: 'K999' })?.id).toBe('K003');
    expect(startCard([], user)).toBeUndefined();
  });
});
