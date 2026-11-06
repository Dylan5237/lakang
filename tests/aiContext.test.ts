import { describe, expect, it } from 'vitest';
import { cardName, cardQuestions } from '../src/lib/aiContext';
import { studyCards } from '../src/lib/study';
import { pickCard } from '../server/retrieval.mjs';
import { readFileSync } from 'node:fs';

describe('概念卡 → AI 的预备提问', () => {
  it('每张卡都有短名与 3–4 个互不相同的提问', () => {
    for (const c of studyCards) {
      const name = cardName(c.id);
      expect(name, c.id).not.toBe('');
      expect(name.length, c.id).toBeLessThanOrEqual(10);
      const qs = cardQuestions(c.id);
      expect(qs.length, c.id).toBeGreaterThanOrEqual(3);
      expect(qs.length, c.id).toBeLessThanOrEqual(4);
      expect(new Set(qs).size, c.id).toBe(qs.length);
      for (const q of qs) expect(q.length, `${c.id} ${q}`).toBeLessThanOrEqual(30);
    }
  });

  it('短名取标题冒号前，否则退到专题名', () => {
    expect(cardName('K015')).toBe('驱力');
    expect(cardName('K078')).toBe('欲望');
    expect(cardQuestions('K015')[0]).toBe('用一个日常的例子讲讲「驱力」');
  });

  it('未知卡片没有提问', () => {
    expect(cardQuestions('K999')).toEqual([]);
  });
});

describe('服务端只认存在的概念卡编号', () => {
  const chunks = JSON.parse(readFileSync(new URL('../server/knowledge/public.json', import.meta.url), 'utf8')) as { id: string; type: string; title: string; text: string }[];
  it('合法编号取到卡片全文；其它输入一律忽略', () => {
    expect(pickCard(chunks, 'K015')?.title).toContain('驱力');
    for (const bad of ['K999', 'T01', 'k015', 'K15', 'K015 ', '../K015', 15, null, undefined, { id: 'K015' }]) expect(pickCard(chunks, bad), String(bad)).toBeNull();
  });
});
