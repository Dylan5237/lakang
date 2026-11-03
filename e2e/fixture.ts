import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Archive, Role, Section } from '../src/types';

export const KEY = 'test-key';
const roles: Role[] = ['analyst', 'patient', 'analyst', 'patient', 'note'];
const who: Record<Role, string> = { analyst: '分析师', patient: '来访者', supervisor: '督导', doctor: '李医生（精神科主治）', note: '说明' };
const section = (c: number, n: number, part: Section['part']): Section => ({
  id: `c${c}s${n}`, title: `第${n}节 虚构标题${n === 2 ? '：一个很长很长很长很长很长很长很长的标题用于测试换行' : ''}`, time: `约 ${n * 5}:00 – ${n * 5 + 4}:59`, part,
  turns: (part === 'interview' ? roles : (['supervisor', 'doctor', 'supervisor'] as Role[])).map((role, i) => ({
    role, who: who[role],
    text: `${role === 'patient' && n === 3 && i === 1 ? '我的父亲总是不在家。' : '虚构发言'}第${n}节第${i + 1}段。` + '这是一段用来撑开气泡宽度的虚构文字，'.repeat(i % 3 + 1) + (i === 0 ? 'averyveryverylongwordwithoutanybreakpointsatalltotestwrapping' : ''),
  })),
});
export const fake: Archive = {
  title: '虚构临床演示 · 测试', notice: ['⚠️ 以下为虚构测试数据。', '第二行说明'],
  cases: [1, 2].map((c) => ({
    id: `case${c}`, date: `1月${c}日`, label: c === 1 ? '虚构女性' : '虚构男性',
    legend: [{ role: 'analyst', text: '分析师 = 测试分析师（法语，经口译）' }, { role: 'patient', text: '来访者 = 虚构' }],
    discussionLabel: '督导讨论 · 约 30 分钟',
    sections: [1, 2, 3, 4, 5, 6].map((n) => section(c, n, n > 4 ? 'discussion' : 'interview')),
    groups: [{ title: '现场判断', layer: 'said', intro: '按原话转述。', cards: [{ tag: '判断', who: '督导', quote: false, html: '虚构判断', refs: [`c${c}s4`] }] },
      { title: '📌 案例核心', cards: [
      { tag: '画像', quote: false, html: '<b>虚构</b><br>简短说明' },
      { tag: '长卡', quote: false, html: '很长的说明，'.repeat(60) + '<ul><li>一</li><li>二</li></ul>' },
      { tag: '', quote: true, html: '"一句引语"' }] }],
  })),
};

const real = process.env.LAKANG_REAL_JSON;
export const archive = (): Archive => real ? JSON.parse(readFileSync(real, 'utf8')) as Archive : fake;

/** Serves the archive like nginx: 403 unless the header carries the key. LAKANG_REAL_JSON swaps in a local private file. */
export async function serveArchive(page: Page, body: Archive | null = fake) {
  const json = real ? readFileSync(real, 'utf8') : JSON.stringify(body);
  await page.route('**/private/clinical.json', (route) => body === null ? route.fulfill({ status: 404, body: '' })
    : route.request().headers()['x-lakang-key'] === KEY ? route.fulfill({ status: 200, contentType: 'application/json', body: json })
      : route.fulfill({ status: 403, body: '' }));
}

export async function unlock(page: Page, hash = '') {
  await serveArchive(page);
  await page.goto('/' + hash);
  await page.getByTestId('key').fill(KEY);
  await page.getByRole('button', { name: '进入' }).click();
}
