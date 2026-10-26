import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cards, sessions, sources, speakers, terms, shelf, cardById, sessionById, sourceById, speakerById, termById } from '../src/data';
import { STAGES } from '../src/types';
import { figureIds } from '../src/components/Figure';
import readingOrder from '../content/reading-order.json';

const root = join(__dirname, '..', 'content');
const chapterText = readdirSync(root).filter((f) => /^chapters-.*\.md$/.test(f)).map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
const chapterIds = new Set([...chapterText.matchAll(/^## (r\d{2})｜/gm)].map((m) => m[1]));
const publicText = (c: (typeof cards)[number]) => [c.title, c.body, c.takeaway, ...c.detail, c.question ?? '', c.action ?? '', c.figure?.alt ?? '', c.figure?.caption ?? ''].join('\n');

describe('内容完整性', () => {
  it('规模与唯一 ID', () => {
    expect(chapterIds.size).toBe(16);
    expect(speakers).toHaveLength(10);
    expect(terms).toHaveLength(18);
    expect(sources).toHaveLength(40);
    expect(sessions).toHaveLength(15);
    expect(cards).toHaveLength(70);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
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
    for (const c of cards) for (const m of publicText(c).matchAll(/\bK\d{3}\b/g)) expect(cardById.has(m[0]), `${c.id} 文中 ${m[0]}`).toBe(true);
  });
  it('章节、讲者、18术语与40来源都有实际入口', () => {
    const covered = (pick: (c: (typeof cards)[number]) => string[]) => new Set(cards.flatMap(pick));
    for (const id of chapterIds) expect(covered((c) => c.chapterIds).has(id), `章 ${id}`).toBe(true);
    for (const s of speakers) expect(covered((c) => c.speakerIds).has(s.id), `讲者 ${s.id}`).toBe(true);
    for (const t of terms) expect(covered((c) => c.termIds ?? []).has(t.id), `术语 ${t.id}`).toBe(true);
    const src = covered((c) => c.sourceIds);
    for (const s of sources) expect(src.has(s.id) || shelf.some((b) => b.sourceIds.includes(s.id)) || terms.some((t) => t.sourceIds.includes(s.id)), `来源 ${s.id}`).toBe(true);
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
    for (const c of cards) for (const w of banned) expect(publicText(c).includes(w), `${c.id} 含「${w}」`).toBe(false);
    for (const x of [...speakers, ...terms, ...shelf]) for (const w of banned) expect(JSON.stringify(x).includes(w), `${x.id} 含「${w}」`).toBe(false);
  });
  it('图示 ID 存在，替代文字/图注齐全，许可文件随站发布', () => {
    const withFig = cards.filter((c) => c.figure);
    expect(withFig.map((c) => c.id)).toContain('K011');
    for (const c of withFig) {
      expect(figureIds.has(c.figure!.id), `${c.id}→${c.figure!.id}`).toBe(true);
      expect(c.figure!.alt.length, `${c.id} 缺 alt`).toBeGreaterThan(20);
      expect(c.figure!.caption.length, `${c.id} 缺图注`).toBeGreaterThan(0);
    }
    const license = readFileSync(join(__dirname, '..', 'public', 'licenses', 'lacan-mathemes-MIT.txt'), 'utf8');
    expect(license).toContain('MIT License');
    expect(license).toContain('Graham Joncas');
  });
  it('虚构示例均有标记，且详情有说明', () => {
    for (const c of cards.filter((x) => x.fictional)) expect(c.detail.join(''), c.id).toMatch(/虚构|示例|练习/);
  });
  it('阅读顺序不丢失或复用旧 ID，知识先于会务工具', () => {
    const ids = Array.from({ length: 73 }, (_, i) => `K${String(i + 1).padStart(3, '0')}`).filter((id) => !['K022', 'K023', 'K024'].includes(id));
    expect([...readingOrder].sort()).toEqual(ids.sort());
    expect(cards.map((c) => c.id)).toEqual(readingOrder);
    expect(readingOrder.slice(0, 4)).toEqual(['K001', 'K002', 'K003', 'K004']);
    expect(readingOrder.indexOf('K015')).toBeLessThan(readingOrder.indexOf('K048'));
    expect(readingOrder.indexOf('K048')).toBeLessThan(readingOrder.indexOf('K066'));
    expect(readingOrder.indexOf('K051')).toBeLessThan(readingOrder.indexOf('K063'));
  });
  it('新增核心知识指向实质文本并给出定位，不只借用会议通知', () => {
    const expected: Record<string, string> = { K015: 'S27', K048: 'S18', K051: 'S37', K047: 'S30', K041: 'S31', K071: 'S33', K056: 'S34', K013: 'S28', K044: 'S39' };
    for (const [id, sid] of Object.entries(expected)) {
      const c = cardById.get(id)!;
      expect(c.sourceIds, id).toContain(sid);
      expect(c.locators?.[sid]?.length, `${id} 定位`).toBeGreaterThan(5);
      expect(c.detail.join(''), `${id} 详情`).not.toBe('');
    }
    expect(termById.get('T16')?.sourceIds).toContain('S35');
    expect(cardById.get('K046')?.detail.join('')).toContain('不是十川');
  });
  it('审读纠错保留：归属不冒充证据，编者工具有独立来源', () => {
    expect(cardById.get('K069')?.takeaway).not.toContain('症状等解码');
    expect(cardById.get('K055')?.body).not.toContain('它说明的是听者');
    expect(cardById.get('K061')?.takeaway).not.toContain('一级证据');
    expect(cardById.get('K073')?.body).toContain('广播问答');
    for (const id of ['K057', 'K059', 'K061', 'K062', 'K063', 'K064']) expect(cardById.get(id)?.sourceIds, id).toContain('S38');
    expect(readFileSync(join(__dirname, '..', 'docs', 'editorial', 'learning-tools.md'), 'utf8')).toContain('不是外部研究');
  });
});
