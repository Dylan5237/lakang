import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cards, allCards, cardById, officialArticles, officialArticleByCard, officialPdfs, activeCardIds, retiredCardIds, sources } from '../src/data';
import { applyFilters, noFilters } from '../src/lib/filter';
import { searchCards } from '../src/lib/search';
import { defaultState, buildExport, parseImport } from '../src/lib/storage';
import { hrefs, parseHash } from '../src/lib/router';
import digestsJson from '../content/official/text-digests.json';
const digests = digestsJson as Record<string,{sha256:string;charactersWithoutWhitespace:number}>;
describe('官方前瞻与替换契约', () => {
  it('四篇原文逐字对照所提供PDF：仅忽略排版空白', () => {
    expect(officialArticles).toHaveLength(4);
    for (const a of officialArticles) {
      const text = a.paragraphs.map((p)=>(p.heading??'')+p.text).join('').replace(/\s+/gu,'');
      expect(createHash('sha256').update(text,'utf8').digest('hex'),a.id).toBe(digests[a.id].sha256);
      expect([...text].length,a.id).toBe(digests[a.id].charactersWithoutWhitespace);
    }
  });
  it('按4/5/5/4张提炼，每张仅引用所属官方文章并定位其段落', () => {
    expect(officialArticles.map((a)=>a.cardIds.length)).toEqual([4,5,5,4]); expect(officialArticleByCard.size).toBe(18);
    for (const a of officialArticles) for (const id of a.cardIds) {
      const c=cardById.get(id)!; expect(activeCardIds.has(id)).toBe(true); expect(c.stage).toBe('official'); expect(c.officialArticleId).toBe(a.id); expect(c.sourceIds).toEqual([a.sourceId]); expect(c.locators?.[a.sourceId]).toMatch(/PDF第/); expect(c.evidenceIds?.length).toBeGreaterThan(0);
      for(const pid of c.evidenceIds??[]) expect(a.paragraphs.some((p)=>p.id===pid),`${id}→${pid}`).toBe(true);
      expect(c.fictional).not.toBe(true);
    }
  });
  it('署名与讲者分开，源文保留自己的术语和拼写', () => {
    expect(officialArticles.map((a)=>a.byline)).toEqual(['王润晨曦','王润晨曦','徐雅珺','骆桂莲']);
    expect(officialArticles[2].title).toContain('摄入'); expect(officialArticles[2].paragraphs.map((p)=>p.text).join('')).toContain('incorporation/Einverleibung');
    expect(officialArticles[3].paragraphs[0].text).toContain('Mathis Gorog');
    expect(sources.filter((s)=>s.officialArticleId).map((s)=>s.id)).toEqual(['S50','S51','S52','S53']);
  });
  it('关键提炼不删问号，不把病例片段升级为普遍疗效', () => {
    expect(cardById.get('K114')?.body).toContain('能否成立'); expect(cardById.get('K114')?.body).toContain('研究问题');
    expect(cardById.get('K108')?.body).toContain('下周'); expect(cardById.get('K112')?.body).toContain('抗抑郁药物'); expect(cardById.get('K112')?.body).toContain('每周两次'); expect(cardById.get('K112')?.body).toContain('复发');
    expect(cardById.get('K111')?.body).toContain('自己'); expect(cardById.get('K117')?.detail.join('')).toContain('尚未给出');
  });
  it('18张旧卡保留原内容与数据语义，收藏筛选仍能找回', () => {
    expect(cards).toHaveLength(100); expect(allCards).toHaveLength(118); expect(retiredCardIds.size).toBe(18);
    expect(cardById.get('K066')?.title).toContain('出发前'); expect(cardById.get('K064')?.title).toContain('笔记');
    const user={favorites:['K064','K108'],read:['K064']};
    const filtered=applyFilters({...noFilters,favOnly:true},user); expect(filtered.map((c)=>c.id)).toEqual(expect.arrayContaining(['K064','K108']));
    expect(applyFilters(noFilters,user).some((c)=>c.id==='K064')).toBe(false);
    expect(searchCards('K064',filtered).map((c)=>c.id)).toEqual(['K064']);
  });
  it('旧备份中的收藏、已读和笔记不被清洗或串到新卡', () => {
    const original={...defaultState(),favorites:['K064'],read:['K064'],notes:{K064:'旧卡的学习笔记'},position:'K064'};
    const result=parseImport(buildExport(original),new Set(allCards.map((c)=>c.id)));
    expect(result.ok).toBe(true); if (!result.ok) throw new Error(result.error);
    expect(result.dropped).toBe(0); expect(result.incoming.notes.K064).toBe('旧卡的学习笔记'); expect(result.incoming.notes.K104).toBeUndefined(); expect(result.incoming.favorites).toContain('K064');
  });
  it('原文路径含稳定段落锚点，无未知文章或PDF假链接', () => {
    for (const a of officialArticles) for(const p of a.paragraphs) expect(parseHash(hrefs.original(a.id,p.id))).toEqual({name:'previews',articleId:a.id,original:true,paragraphId:p.id});
    for (const [id,path] of Object.entries(officialPdfs)) { const a=officialArticles.find((x)=>x.id===id)!; expect(a).toBeDefined(); expect(path).toBe(`./originals/${id}.pdf`); expect(createHash('sha256').update(readFileSync(new URL(`../public/originals/${id}.pdf`,import.meta.url))).digest('hex')).toBe(a.sha256); }
    expect(parseHash('#/previews/%zz')).toEqual({name:'feed'});
  });
});
