import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { cardById, cardOrder, pathById, paths, sourceById, studyCards, studySources, termById, terms } from '../src/lib/study';
import { figureIds } from '../src/components/Figure';

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

  it('阅读路径：ID 唯一，全部学习卡恰好归入一条路径，卡片上的路径标注与路径一致', () => {
    expect(paths.length).toBeGreaterThanOrEqual(6);
    expect(new Set(paths.map((p) => p.id)).size).toBe(paths.length);
    const seen = new Set<string>();
    for (const p of paths) {
      expect(p.title.length, p.id).toBeGreaterThan(2);
      expect(p.outcome.length, p.id).toBeGreaterThan(4);
      expect(p.cardIds.length, p.id).toBeGreaterThan(0);
      for (const id of p.cardIds) {
        expect(cardById.has(id), `${p.id}→${id}`).toBe(true);
        expect(seen.has(id), `${id} 出现在多条路径`).toBe(false);
        seen.add(id);
        expect(cardById.get(id)!.pathId, id).toBe(p.id);
        expect(cardById.get(id)!.pathTitle, id).toBe(p.title);
      }
    }
    expect([...seen].sort()).toEqual(studyCards.map((c) => c.id).sort());
    expect(pathById.size).toBe(paths.length);
  });

  it('前台不出现编辑说明与会议现场口吻', () => {
    const banned = ['来源真实性', '核验边界', '未核读', '核读记录', '编辑说明', '本届', '会前', '会场', '参会'];
    for (const c of studyCards) {
      const text = [c.title, c.body, c.takeaway, ...c.detail, c.question ?? '', c.action ?? ''].join('\n');
      for (const w of banned) expect(text.includes(w), `${c.id} 含「${w}」`).toBe(false);
    }
    for (const t of terms) {
      const text = [t.zh, t.original, t.brief, t.detail ?? ''].join('\n');
      for (const w of banned) expect(text.includes(w), `${t.id} 含「${w}」`).toBe(false);
    }
  });

  it('图式：ID 存在，替代文字与图注齐全，许可文件随站发布', () => {
    const withFig = studyCards.filter((c) => c.figure);
    expect(withFig.map((c) => c.id)).toEqual(expect.arrayContaining(['K011', 'K088']));
    for (const c of withFig) {
      expect(figureIds.has(c.figure!.id), `${c.id}→${c.figure!.id}`).toBe(true);
      expect(c.figure!.alt.length, `${c.id} alt`).toBeGreaterThan(20);
      expect(c.figure!.caption.length, `${c.id} caption`).toBeGreaterThan(10);
    }
    const license = readFileSync(new URL('../public/licenses/lacan-mathemes-MIT.txt', import.meta.url), 'utf8');
    expect(license).toContain('MIT License');
    expect(license).toContain('Graham Joncas');
  });

  it('来源字段齐全且 URL 可用', () => {
    for (const s of studySources) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.url.startsWith('http'), s.id).toBe(true);
    }
  });
});
