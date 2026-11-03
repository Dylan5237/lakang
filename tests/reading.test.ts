import { describe, expect, it } from 'vitest';
import { findHits, highlight, roleCounts } from '../src/lib/reading';
import { hrefs, parseHash } from '../src/lib/router';
import type { Role, Section } from '../src/types';

const sections: Section[] = [
  { id: 's1', title: 'a', time: '', part: 'interview', turns: [
    { role: 'analyst', who: '分析师', text: '你的父亲怎样？' }, { role: 'patient', who: '来访者', text: '父亲很严厉，ＡＢＣ' }] },
  { id: 's2', title: 'b', time: '', part: 'discussion', turns: [{ role: 'supervisor', who: '督导', text: '父亲 的位置' }] },
];
const all = new Set<Role>(['analyst', 'patient', 'supervisor', 'doctor', 'note']);

describe('阅读工具', () => {
  it('搜索按阅读顺序返回命中，可按说话人限制，多词需全部命中', () => {
    expect(findHits(sections, '父亲', all)).toEqual([{ sectionId: 's1', index: 0 }, { sectionId: 's1', index: 1 }, { sectionId: 's2', index: 0 }]);
    expect(findHits(sections, '父亲', new Set<Role>(['patient']))).toEqual([{ sectionId: 's1', index: 1 }]);
    expect(findHits(sections, '父亲 位置', all)).toEqual([{ sectionId: 's2', index: 0 }]);
    expect(findHits(sections, '   ', all)).toEqual([]);
    expect(findHits(sections, 'abc', all)).toEqual([{ sectionId: 's1', index: 1 }]);
  });
  it('高亮切分不丢字', () => {
    const p = highlight('父亲很严厉，父亲', '父亲');
    expect(p.map((x) => x.text).join('')).toBe('父亲很严厉，父亲');
    expect(p.filter((x) => x.match).map((x) => x.text)).toEqual(['父亲', '父亲']);
    expect(highlight('无', '')).toEqual([{ text: '无', match: false }]);
  });
  it('统计各说话人发言数', () => {
    expect(roleCounts(sections)).toEqual({ analyst: 1, patient: 1, supervisor: 1 });
  });
  it('路由：列表、对话（含节）、要点；坏链接回首页', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash(hrefs.talk('case1'))).toEqual({ name: 'case', caseId: 'case1', tab: 'talk', sectionId: undefined });
    expect(parseHash(hrefs.talk('case1', 'c1s3'))).toEqual({ name: 'case', caseId: 'case1', tab: 'talk', sectionId: 'c1s3' });
    expect(parseHash(hrefs.notes('case2'))).toEqual({ name: 'case', caseId: 'case2', tab: 'notes' });
    expect(parseHash('#/card/K010/more')).toEqual({ name: 'home' });
    expect(parseHash('#/%zz')).toEqual({ name: 'home' });
  });
});
