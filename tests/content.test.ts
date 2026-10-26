import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cards, allCards, retiredCards, retiredCardIds, activeCardIds, cardsBySession, sessions, sources, speakers, terms, shelf, series, seriesByCard, cardById, sessionById, sourceById, speakerById, termById } from '../src/data';
import { STAGES } from '../src/types';
import { figureIds } from '../src/components/Figure';
import readingOrder from '../content/reading-order.json';
import additionalTerms from '../content/terms-extension.json';
const root = join(__dirname, '..', 'content');
const chapterText = readdirSync(root).filter((f) => /^chapters-.*\.md$/.test(f)).map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
const chapterIds = new Set([...chapterText.matchAll(/^## (r\d{2})｜/gm)].map((m) => m[1]));
const publicText = (c: (typeof cards)[number]) => [c.title, c.body, c.takeaway, ...c.detail, c.question ?? '', c.action ?? '', c.figure?.alt ?? '', c.figure?.caption ?? ''].join('\n');
const cardId = (n: number) => `K${String(n).padStart(3, '0')}`;
describe('内容完整性', () => {
  it('规模与唯一 ID：100主卡与18附录不混计', () => {
    expect(chapterIds.size).toBe(16); expect(speakers).toHaveLength(10); expect(terms).toHaveLength(26); expect(sources).toHaveLength(53); expect(sessions).toHaveLength(15); expect(cards).toHaveLength(100); expect(allCards).toHaveLength(118); expect(retiredCards).toHaveLength(18);
    for (const rows of [allCards, sources, terms, speakers, shelf, sessions, series]) expect(new Set(rows.map((x) => x.id)).size).toBe(rows.length);
  });
  it('主卡及附录字段合法且无悬空引用', () => {
    const stages = new Set(STAGES.map((s) => s.id));
    for (const c of allCards) {
      expect(stages.has(c.stage), c.id).toBe(true); expect(Boolean(c.title && c.body && c.takeaway), c.id).toBe(true); expect(Array.isArray(c.detail), c.id).toBe(true); expect(c.sourceIds.length, c.id).toBeGreaterThan(0);
      for (const id of c.sourceIds) expect(sourceById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.chapterIds) expect(chapterIds.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.speakerIds) expect(speakerById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.sessionIds) expect(sessionById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of c.relatedCardIds) { expect(cardById.has(id), `${c.id}→${id}`).toBe(true); expect(id).not.toBe(c.id); }
      for (const id of c.termIds ?? []) expect(termById.has(id), `${c.id}→${id}`).toBe(true);
      for (const id of Object.keys(c.locators ?? {})) expect(c.sourceIds, `${c.id} locator ${id}`).toContain(id);
    }
  });
  it('正文引用编号仍可到达，附录不成为断链', () => { for (const c of allCards) for (const m of publicText(c).matchAll(/\bK\d{3}\b/g)) expect(cardById.has(m[0]), `${c.id} 文中 ${m[0]}`).toBe(true); });
  it('章节、讲者、术语与来源仍有主卡或附录入口', () => {
    const covered = (pick: (c: (typeof cards)[number]) => string[]) => new Set(allCards.flatMap(pick));
    for (const id of chapterIds) expect(covered((c) => c.chapterIds).has(id), `章 ${id}`).toBe(true);
    for (const s of speakers) expect(covered((c) => c.speakerIds).has(s.id), `讲者 ${s.id}`).toBe(true);
    for (const t of terms) expect(covered((c) => c.termIds ?? []).has(t.id), `术语 ${t.id}`).toBe(true);
    const src = covered((c) => c.sourceIds);
    for (const s of sources) expect(src.has(s.id) || shelf.some((b) => b.sourceIds.includes(s.id)) || terms.some((t) => t.sourceIds.includes(s.id)), `来源 ${s.id}`).toBe(true);
  });
  it('所有日程与讲者有可达卡片，未知讲题不伪造官方文章', () => {
    for (const s of sessions) { expect(cardsBySession.get(s.id)?.length, s.id).toBeGreaterThan(0); for (const c of cardsBySession.get(s.id) ?? []) expect(c.sessionIds).toContain(s.id); for (const id of s.speakerIds) expect(speakerById.has(id)).toBe(true); }
    for (const sp of speakers) expect(cardById.get(sp.cardId)?.speakerIds, sp.id).toContain(sp.id);
    for (const t of terms) for (const id of t.sourceIds) expect(sourceById.has(id)).toBe(true);
    for (const b of shelf) for (const id of b.sourceIds) expect(sourceById.has(id)).toBe(true);
  });
  it('日程固定约束', () => {
    const get = (id: string) => sessionById.get(id)!;
    expect(get('d28-opening').venue).toContain('冼为坚'); expect(get('d28-keynotes').venue).toContain('冼为坚');
    expect([get('d28-keynotes').start, get('d28-keynotes').end]).toEqual(['09:30', '12:00']); expect(get('d28-keynotes').talks).toHaveLength(2);
    for (const id of ['d29-writing','d29-clinical','d29-rhythm']) expect(get(id).venue).toContain('401'); expect(get('d29-adolescent').venue).toContain('Rx104');
  });
  it('提炼卡不含真实性说明墙与联系付款信息', () => {
    const banned = ['来源真实性','核验边界','未核读','核读记录','编辑说明','微信','WeChat','二维码','缴费','付款'];
    for (const c of allCards) for (const w of banned) expect(publicText(c).includes(w), `${c.id} 含「${w}」`).toBe(false);
    for (const x of [...speakers,...terms,...shelf,...series]) for (const w of banned) expect(JSON.stringify(x).includes(w), `${x.id} 含「${w}」`).toBe(false);
  });
  it('图示与许可完整保留', () => {
    const withFig = cards.filter((c) => c.figure); expect(withFig.map((c) => c.id)).toContain('K011');
    for (const c of withFig) { expect(figureIds.has(c.figure!.id)).toBe(true); expect(c.figure!.alt.length).toBeGreaterThan(20); expect(c.figure!.caption.length).toBeGreaterThan(0); }
    const license = readFileSync(join(__dirname,'..','public','licenses','lacan-mathemes-MIT.txt'),'utf8'); expect(license).toContain('MIT License'); expect(license).toContain('Graham Joncas');
  });
  it('虚构示例标记与详情仍一致', () => { for (const c of allCards.filter((x) => x.fictional)) expect(c.detail.join(''), c.id).toMatch(/虚构|示例|练习/); });
  it('替换不复用ID：原100条仍在，新18条进入主流，附录退出主流', () => {
    const oldIds = Array.from({length:103},(_,i)=>cardId(i+1)).filter((id)=>!['K022','K023','K024'].includes(id));
    for (const id of oldIds) expect(cardById.has(id),id).toBe(true);
    expect([...activeCardIds].filter((id)=>retiredCardIds.has(id))).toEqual([]);
    expect(new Set([...activeCardIds,...retiredCardIds]).size).toBe(allCards.length);
    expect(cards.map((c)=>c.id)).toEqual(readingOrder); expect(readingOrder.slice(0,4)).toEqual(['K001','K002','K003','K004']);
    expect(readingOrder.slice(4,22)).toEqual(Array.from({length:18},(_,i)=>cardId(i+104)));
    for (const id of retiredCardIds) expect(readingOrder).not.toContain(id);
    expect(readingOrder.indexOf('K015')).toBeLessThan(readingOrder.indexOf('K048'));
  });
  it('已有核心知识的实质文本及定位不回退', () => {
    const expected: Record<string,string> = { K015:'S27',K048:'S18',K051:'S37',K047:'S30',K041:'S31',K071:'S33',K056:'S34',K013:'S28',K044:'S39',K074:'S41',K076:'S35',K091:'S44',K093:'S43',K094:'S47',K097:'S46',K102:'S45' };
    for (const [id,sid] of Object.entries(expected)) { const c=cardById.get(id)!; expect(c.sourceIds,id).toContain(sid); expect(c.locators?.[sid]?.length,id).toBeGreaterThan(5); expect(c.detail.join('')).not.toBe(''); }
    expect(termById.get('T16')?.sourceIds).toContain('S35'); expect(cardById.get('K046')?.detail.join('')).toContain('不是十川');
  });
  it('审读纠错与原创工具归属保留', () => {
    expect(cardById.get('K069')?.takeaway).not.toContain('症状等解码'); expect(cardById.get('K055')?.body).not.toContain('它说明的是听者'); expect(cardById.get('K061')?.takeaway).not.toContain('一级证据'); expect(cardById.get('K073')?.body).toContain('广播问答');
    for (const id of ['K057','K059','K061','K062','K063','K064']) expect(cardById.get(id)?.sourceIds,id).toContain('S38'); expect(readFileSync(join(__dirname,'..','docs','editorial','learning-tools.md'),'utf8')).toContain('不是外部研究');
  });
  it('六组精读及基础卡继续在主流内，顺序连续', () => {
    expect(series).toHaveLength(6); expect(seriesByCard.size).toBe(30); expect(series.flatMap((x)=>x.cardIds).sort()).toEqual(Array.from({length:30},(_,i)=>cardId(i+74)).sort());
    for (const item of series) { expect(item.cardIds).toHaveLength(5); expect(item.intro.length).toBeGreaterThan(20); expect(item.outcome.length).toBeGreaterThan(10); for (const id of [...item.cardIds,...item.foundationIds]) expect(activeCardIds.has(id),id).toBe(true); for (const id of item.sessionIds) expect(sessionById.has(id)).toBe(true); const indices=item.cardIds.map((id)=>readingOrder.indexOf(id)); expect(indices).toEqual(indices.map((_,i)=>indices[0]+i)); }
  });
  it('精读分节和定位未被新卡替代', () => {
    for (const id of seriesByCard.keys()) { const c=cardById.get(id)!; expect(c.detail.filter((s)=>s.startsWith('### ')).length,id).toBeGreaterThanOrEqual(4); expect(c.detail.join('').length,id).toBeGreaterThan(350); expect(c.sourceIds.some((s)=>s!=='S01'&&s!=='S38'),id).toBe(true); for(const sid of c.sourceIds) expect(c.locators?.[sid]?.length).toBeGreaterThan(3); }
  });
  it('术语双向链接完整', () => { for (const t of additionalTerms) for (const id of t.cardIds) { expect(cardById.has(id)).toBe(true); expect(cardById.get(id)?.termIds).toContain(t.id); } });
});
