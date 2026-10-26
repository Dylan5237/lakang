import { describe, expect, it } from 'vitest';
import { cards } from '../src/data';
import { searchCards } from '../src/lib/search';

describe('全文搜索', () => {
  it('空查询返回全部', () => {
    expect(searchCards('')).toHaveLength(cards.length);
    expect(searchCards('   ')).toHaveLength(cards.length);
  });

  it('中文子串命中且标题优先', () => {
    const r = searchCards('糖肽');
    expect(r.length).toBeGreaterThan(0);
    const ids = r.map((c) => c.id);
    expect(ids).toContain('K039');
    expect(r[0].title + r[0].takeaway).toMatch(/糖肽|多糖/);
  });

  it('可按讲者名、原词与术语检索', () => {
    expect(searchCards('Faucher').map((c) => c.id)).toContain('K029');
    expect(searchCards('équivoque').length).toBeGreaterThan(0);
    expect(searchCards('十川').map((c) => c.id)).toContain('K033');
  });

  it('多词为与关系；无命中返回空；全角半角归一', () => {
    const a = searchCards('歧义');
    const b = searchCards('歧义 检查点');
    expect(b.length).toBeLessThanOrEqual(a.length);
    expect(searchCards('这个词绝对不存在xyz')).toEqual([]);
    expect(searchCards('ｋ０３９').map((c) => c.id)).toContain('K039');
  });

  it('可限定在已筛选的卡片集合内', () => {
    const pool = cards.filter((c) => c.stage === 'clinic');
    for (const c of searchCards('笔记', pool)) expect(c.stage).toBe('clinic');
  });
});
