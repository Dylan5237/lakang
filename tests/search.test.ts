import { describe, expect, it } from 'vitest';
import { cards } from '../src/data';
import { searchCards } from '../src/lib/search';

describe('全文搜索', () => {
  it('空查询返回全部并保留学习顺序', () => {
    expect(searchCards('')).toEqual(cards);
    expect(searchCards('   ')).toEqual(cards);
  });
  it('中文子串命中；标题命中优先，正文仍可检索', () => {
    const r = searchCards('并入');
    expect(r.length).toBeGreaterThan(0);
    expect(r.map((c) => c.id)).toContain('K048');
    expect(r[0].title).toContain('并入');
    expect(searchCards('糖肽').map((c) => c.id)).toContain('K039');
  });
  it('可按讲者名、原词与术语检索', () => {
    expect(searchCards('Faucher').map((c) => c.id)).toContain('K029');
    expect(searchCards('équivoque').length).toBeGreaterThan(0);
    expect(searchCards('十川').map((c) => c.id)).toContain('K033');
  });
  it('多词为与关系；无命中返回空；全角半角归一', () => {
    const a = searchCards('并入');
    const b = searchCards('并入 安葬');
    expect(b.length).toBeGreaterThan(0);
    expect(b.length).toBeLessThanOrEqual(a.length);
    expect(b.every((c) => a.some((x) => x.id === c.id))).toBe(true);
    expect(searchCards('这个词绝对不存在xyz')).toEqual([]);
    expect(searchCards('ｋ０３９').map((c) => c.id)).toContain('K039');
  });
  it('可限定在已筛选的卡片集合内', () => {
    const pool = cards.filter((c) => c.stage === 'clinic');
    const found = searchCards('笔记', pool);
    expect(found.length).toBeGreaterThan(0);
    for (const c of found) expect(c.stage).toBe('clinic');
  });
});
