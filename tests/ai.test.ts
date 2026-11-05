import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { retrieve, queryTokens, scoreChunk, snippet } from '../server/retrieval.mjs';

const publicChunks = JSON.parse(readFileSync(new URL('../server/knowledge/public.json', import.meta.url), 'utf8')) as { id: string; type: string; title: string; text: string; tags?: string[] }[];
const experts: typeof publicChunks = [
  { id: 'E01', type: 'expert', title: '父性隐喻与除权', text: '父之名作为能指若未注册，法则的隐喻中介就缺位；被排除者以实在界形式返回。', tags: ['父之名', '除权'] },
];
const k = { publicChunks, expertChunks: experts };

describe('站内检索', () => {
  it('公开知识只含学习内容，不含临床记录', () => {
    expect(publicChunks.length).toBeGreaterThan(90);
    const raw = JSON.stringify(publicChunks);
    expect(raw).not.toMatch(/\bc[1-4]s\d+\b/);       // case section ids
    expect(raw).not.toContain('28岁女性');
    expect(raw).not.toContain('10月28日');
    expect(raw).not.toContain('督导（经口译）');
  });

  it('中文查询按词与字命中，术语/卡片优先', () => {
    const r = retrieve('什么是除权', k);
    const ids = r.public.map((c) => c.id);
    expect(ids).toContain('T27');
    expect(ids.slice(0, 2)).toContain('T27');
    expect(retrieve('三环纽结为什么没有基础', k).public.map((c) => c.id)).toEqual(expect.arrayContaining(['K011', 'K088']));
    expect(retrieve('享乐和快乐有什么区别', k).public.slice(0, 2).map((c) => c.id)).toContain('T06');
    expect(retrieve('推荐一条入门阅读路径', k).public.some((c) => c.type === 'path')).toBe(true);
  });

  it('专家要点只在相关时加入，避免无关噪声', () => {
    expect(retrieve('父性隐喻是什么', k).experts.map((c) => c.id)).toContain('E01');
    expect(retrieve('推荐一条入门阅读路径', k).experts).toEqual([]);
  });

  it('空查询与无匹配不返回内容，摘要不越界', () => {
    expect(retrieve('', k)).toEqual({ public: [], experts: [] });
    expect(retrieve('量子色动力学', k).public).toEqual([]);
    const s = snippet('一二三四五六七八九十', '五六', 4);
    expect(s.length).toBeLessThanOrEqual(6);
  });

  it('分词与打分可单独使用', () => {
    expect(queryTokens('除权是什么')).toContain('除权');
    expect(scoreChunk(publicChunks[0], publicChunks[0].title)).toBeGreaterThan(0);
  });
});
