import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cards, sessions, sources, speakers, terms, shelf, cardById, sessionById, sourceById, speakerById, termById } from '../src/data';
import { STAGES } from '../src/types';

const root = join(__dirname, '..', 'content');
const chapterText = readdirSync(root)
  .filter((f) => /^chapters-.*\.md$/.test(f))
  .map((f) => readFileSync(join(root, f), 'utf8'))
  .join('\n');
const chapterIds = new Set([...chapterText.matchAll(/^## (r\d{2})｜/gm)].map((m) => m[1]));

const publicText = (c: (typeof cards)[number]) =>
  [c.title, c.body, c.takeaway, ...c.detail, c.question ?? '', c.action ?? ''].join('\n');

describe('内容完整性', () => {
  it('规模与唯一 ID', () => {
    expect(chapterIds.size).toBe(16);
    expect(speakers).toHaveLength(10);
    expect(terms).toHaveLength(13);
    expect(sources).toHaveLength(26);
    expect(sessions).toHaveLength(15);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    expect(cards.length).toBeGreaterThanOrEqual(60);
  });

  it('卡片字段合法且无悬空引用', () => {
    const stages = new Set(STAGES.map((s) => s.id));
    for (const c of cards) {
      expect(stages.has(c.stage), c.id).toBe(true);
      expect(Boolean(c.title && c.body && c.takeaway), c.id).toBe(true);
      expect(Array.isArray(c.detail), c.id).toBe(true);
      expect(c.sourceIds.length, `${c.id} 缺来源`).toBeGreaterThan(0);
      for (const id of c.sourceIds) expect(sourceById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.chapterIds) expect(chapterIds.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.speakerIds) expect(speakerById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.sessionIds) expect(sessionById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.relatedCardIds) {
        expect(cardById.has(id), `${c.id}→${id}`).toBe(true);
        expect(id, `${c.id} 自引用`).not.toBe(c.id);
      }
      for (const id of c.termIds ?? []) expect(termById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of Object.keys(c.locators ?? {})) expect(c.sourceIds, `${c.id} locator ${id}`).toContain(id);
    }
  });

  it('卡片文字中引用的 K 编号都存在', () => {
    for (const c of cards) {
      for (const m of publicText(c).matchAll(/\bK\d{3}\b/g)) expect(cardById.has(m[0]), `${c.id} 文中 ${m[0]}`).toBe(true);
    }
  });

  it('16 章、10 讲者、13 术语、26 来源均被覆盖', () => {
    const covered = (pick: (c: (typeof cards)[number]) => string[]) => new Set(cards.flatMap(pick));
    const chapters = covered((c) => c.chapterIds);
    for (const id of chapterIds) expect(chapters.has(id), `章 ${id}`).toBe(true);
    const sp = covered((c) => c.speakerIds);
    for (const s of speakers) expect(sp.has(s.id), `讲者 ${s.id}`).toBe(true);
    const tm = covered((c) => c.termIds ?? []);
    for (const t of terms) expect(tm.has(t.id), `术语 ${t.id}`).toBe(true);
    const src = covered((c) => c.sourceIds);
    for (const s of sources) {
      const used = src.has(s.id) || shelf.some((b) => b.sourceIds.includes(s.id)) || terms.some((t) => t.sourceIds.includes(s.id));
      expect(used, `来源 ${s.id}`).toBe(true);
    }
  });

  it('日程与卡片、讲者互相可达', () => {
    for (const s of sessions) {
      expect(cards.some((c) => c.sessionIds.includes(s.id)), `场次 ${s.id} 无关联卡`).toBe(true);
      for (const id of s.speakerIds) expect(speakerById.has(id), `${s.id}→${id}`).toBe(true);
    }
    for (const sp of speakers) expect(cardById.get(sp.cardId)?.speakerIds, sp.id).toContain(sp.id);
    for (const t of terms) for (const id of t.sourceIds) expect(sourceById.has(id), `${t.id}→${id}`).toBe(true);
    for (const b of shelf) for (const id of b.sourceIds) expect(sourceById.has(id), `${b.id}→${id}`).toBe(true);
  });

  it('日程固定约束', () => {
    const get = (id: string) => sessionById.get(id)!;
    expect(get('d28-opening').venue).toContain('冼为坚');
    expect(get('d28-keynotes').venue).toContain('冼为坚');
    expect([get('d28-keynotes').start, get('d28-keynotes').end]).toEqual(['09:30', '12:00']);
    expect(get('d28-keynotes').talks).toHaveLength(2);
    for (const id of ['d29-writing', 'd29-clinical', 'd29-rhythm']) expect(get(id).venue, id).toContain('401');
    expect(get('d29-adolescent').venue).toContain('Rx104');
  });

  it('前台正文不含编辑说明与联系/付款信息', () => {
    const banned = ['来源真实性', '核验边界', '未核读', '核读记录', '编辑说明', '微信', 'WeChat', '二维码', '缴费', '付款'];
    for (const c of cards) {
      const text = publicText(c);
      for (const w of banned) expect(text.includes(w), `${c.id} 含「${w}」`).toBe(false);
    }
    for (const x of [...speakers, ...terms, ...shelf]) {
      const text = JSON.stringify(x);
      for (const w of banned) expect(text.includes(w), `${x.id} 含「${w}」`).toBe(false);
    }
  });

  it('虚构示例均有标记，且详情有说明', () => {
    for (const c of cards.filter((x) => x.fictional)) {
      expect(c.detail.join(''), c.id).toMatch(/虚构|示例|练习/);
    }
  });
});
