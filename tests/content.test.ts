import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cardById, cardOrder, sourceById, studyCards, studySources, termById, terms } from '../src/lib/study';

describe('公开学习内容完整性', () => {
  it('卡片顺序与卡片集一一对应，ID 唯一', () => {
    expect(new Set(studyCards.map((c) => c.id)).size).toBe(studyCards.length);
    expect(new Set(cardOrder).size).toBe(cardOrder.length);
    expect([...cardOrder].sort()).toEqual([...studyCards.map((c) => c.id)].sort());
  });

  it('卡片无悬空引用：术语、来源、相关卡；locators 键属于 sourceIds', () => {
    for (const c of studyCards) {
      for (const t of c.termIds) expect(termById.has(t), `${c.id}→${t}`).toBe(true);
      for (const s of c.sourceIds) expect(sourceById.has(s), `${c.id}→${s}`).toBe(true);
      for (const r of c.relatedCardIds) expect(cardById.has(r), `${c.id}→${r}`).toBe(true);
      for (const k of Object.keys(c.locators)) expect(c.sourceIds.includes(k), `${c.id} locator ${k}`).toBe(true);
      expect(c.body.length, `${c.id} 正文`).toBeGreaterThan(10);
      expect(c.takeaway.length, `${c.id} 要点`).toBeGreaterThan(4);
    }
  });

  it('术语：ID 唯一，相关术语存在，案例回链格式合法', () => {
    expect(new Set(terms.map((t) => t.id)).size).toBe(terms.length);
    for (const t of terms) {
      for (const r of t.related ?? []) expect(termById.has(r), `${t.id}→${r}`).toBe(true);
      for (const s of t.sourceIds) expect(sourceById.has(s), `${t.id}→${s}`).toBe(true);
      for (const l of t.caseLinks ?? []) {
        expect(l.case, `${t.id} case`).toMatch(/^case[12]$/);
        expect(l.section, `${t.id} section`).toMatch(/^c[12]s\d+$/);
        expect(l.note.length, `${t.id} note`).toBeGreaterThan(4);
      }
    }
  });

  it('正文里的 K### 提及若存在则可链接，不指向已下线的会议卡', () => {
    const offline = new Set(JSON.parse(readFileSync(new URL('../content/card-order.json', import.meta.url), 'utf8')));
    const mentioned = new Set(studyCards.flatMap((c) => [c.body, c.takeaway, ...c.detail].join(' ').match(/K\d{3}/g) ?? []));
    for (const id of mentioned) expect(offline.has(id), `${id} 不在学习卡中却出现在正文`).toBe(true);
  });

  it('来源字段齐全且 URL 可用', () => {
    for (const s of studySources) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.url.startsWith('http'), s.id).toBe(true);
    }
  });
});
