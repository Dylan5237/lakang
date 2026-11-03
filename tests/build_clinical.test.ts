import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Archive } from '../src/types';

const python = process.platform === 'win32' ? 'python' : 'python3';

describe('scripts/build_clinical.py', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'clinical-')), 'out.json');
  execFileSync(python, ['scripts/build_clinical.py', 'tests/fixtures/sample.html', out]);
  const data = JSON.parse(readFileSync(out, 'utf8')) as Archive;

  it('拆出标题、说明、两个案例与访谈/讨论两部分', () => {
    expect(data.title).toBe('示例临床演示 · 测试');
    expect(data.notice[0]).toContain('虚构测试数据');
    expect(data.cases.map((c) => [c.id, c.date, c.label])).toEqual([['case1', '1月1日', '甲'], ['case2', '1月2日', '乙']]);
    const [a] = data.cases;
    expect(a.sections.map((s) => [s.id, s.title, s.time, s.part])).toEqual([
      ['c1s1', '一、开场', '约 00:00 – 01:00', 'interview'], ['c1s2', '二、讨论', '约 10:00', 'discussion']]);
    expect(a.discussionLabel).toBe('讨论 · 约 10 分钟');
    expect(a.sections[0].turns.map((t) => t.role)).toEqual(['note', 'analyst', 'patient']);
    expect(a.sections[1].turns.map((t) => [t.role, t.who])).toEqual([['supervisor', '督导'], ['doctor', '李医生']]);
    expect(a.sections[0].turns[2].text).toBe('第一行\n第二行');
  });

  it('图例按圆点颜色识别角色，图例标题不成为分组', () => {
    const [a] = data.cases;
    expect(a.legend).toEqual([{ role: 'analyst', text: '分析师 = 甲' }, { role: 'doctor', text: '李医生 = 医生' }]);
    expect(a.groups.map((g) => g.title)).toEqual(['📌 核心']);
  });

  it('要点卡只保留 b/br/ul/li，其余转义或去标签', () => {
    const [card, quote] = data.cases[0].groups[0].cards;
    expect(card.tag).toBe('画像');
    expect(card.html).toBe('<b>要点</b><br>说明 斜体 &lt;img&gt;<ul><li>一</li></ul>');
    expect(quote).toMatchObject({ quote: true, tag: '' });
    expect(JSON.stringify(data)).not.toMatch(/<(script|i|img)\b/);
  });
});
