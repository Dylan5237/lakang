import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const readingOrder = JSON.parse(readFileSync(new URL('../content/reading-order.json', import.meta.url), 'utf8')) as string[];
// Fixed RNG only in these regression tests: Fisher-Yates with zero rotates left by one.
// Product code uses Math.random; dedicated random-feed tests cover other permutations.
const [first, second, third, fourth] = readingOrder.slice(1);
const activeId = async (page: Page) => (await page.evaluate(() => location.hash)).replace(/^#\/card\//, '').split('/')[0];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/'); await expect(page.getByTestId('feed')).toBeVisible();
  await expect.poll(() => activeId(page)).toBe(first);
});
test('随机队列的下一张按钮和j/k切换，回退恢复上一张', async ({ page }) => {
  await expect(page.locator(`.card[data-card-id="${first}"] .card-title`)).toBeVisible();
  await page.getByRole('button', { name: '下一张' }).click(); await expect.poll(() => activeId(page)).toBe(second);
  await page.getByTestId('feed').focus(); await page.keyboard.press('j'); await expect.poll(() => activeId(page)).toBe(third);
  await page.keyboard.press('k'); await expect.poll(() => activeId(page)).toBe(second);
});
test('触摸上下划沿同一随机队列前进和回退', async ({ page }) => {
  const box = (await page.getByTestId('feed').boundingBox())!;
  const cdp = await page.context().newCDPSession(page); const x = box.x + box.width / 2;
  const swipe = async (from: number, dy: number) => {
    let y = box.y + box.height * from;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 0; i < 12; i++) { y += dy; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(.85, -30); await expect.poll(() => activeId(page)).toBe(second);
  await swipe(.3, 30); await expect.poll(() => activeId(page)).toBe(first);
});
test('收藏/已读/笔记写入本地存储，刷新后保留', async ({ page }) => {
  const card = page.locator(`.card[data-card-id="${first}"]`);
  await card.getByRole('button', { name: '收藏' }).click(); await expect(card.getByRole('button', { name: '已收藏' })).toHaveAttribute('aria-pressed', 'true');
  await card.getByRole('button', { name: '标已读' }).click(); await expect(card.getByRole('button', { name: '已读' })).toBeVisible();
  await card.getByRole('button', { name: '展开读' }).click(); const dlg = page.getByTestId('detail'); await expect(dlg).toBeVisible();
  await dlg.getByLabel('我的笔记').fill('我的测试笔记'); await page.keyboard.press('Escape'); await expect(dlg).toBeHidden(); await page.reload();
  await expect(page.locator('.card[data-card-id]').first()).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lakang:v1') ?? '{}'));
  expect(stored.favorites).toContain(first); expect(stored.read).toContain(first); expect(stored.notes[first]).toBe('我的测试笔记');
});
test('阅读位置：随机队列第4张刷新后仍停在该张', async ({ page }) => {
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '下一张' }).click();
  await expect.poll(() => activeId(page)).toBe(fourth); await page.goto('/#/'); await page.reload(); await expect.poll(() => activeId(page)).toBe(fourth);
});
test('展开读：详情含出处，返回键关闭并恢复展开按钮焦点', async ({ page }) => {
  const open = page.locator(`.card[data-card-id="${first}"]`).getByRole('button', { name: '展开读' });
  await open.focus(); await open.click(); const dlg = page.getByTestId('detail'); await expect(dlg).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe(`#/card/${first}/more`); await expect(dlg.getByTestId('sources')).toBeVisible();
  await page.goBack(); await expect(dlg).toBeHidden(); expect(await page.evaluate(() => location.hash)).toBe(`#/card/${first}`); await expect(open).toBeFocused();
});
test('直接打开详情仍精确落在指定卡片', async ({ page }) => {
  await page.goto('/#/card/K010/more'); await page.reload(); await expect(page.getByTestId('detail')).toBeVisible();
  await page.getByRole('button', { name: '关闭' }).click(); await expect(page.getByTestId('detail')).toBeHidden(); await expect.poll(() => activeId(page)).toBe('K010');
});
test('搜索与筛选：关键词命中、仅看收藏、清除', async ({ page }) => {
  await page.locator(`.card[data-card-id="${first}"]`).getByRole('button', { name: '收藏' }).click(); await page.getByTestId('open-filter').click();
  const sheet = page.getByRole('dialog', { name: '搜索与筛选' }); await expect(sheet).toBeVisible();
  await sheet.getByRole('searchbox').fill('K002'); await expect(sheet.locator('.hit-list li').first()).toBeVisible(); await sheet.getByRole('searchbox').fill('');
  await sheet.getByRole('button', { name: /收藏/ }).first().click(); await sheet.getByTestId('apply-filters').click();
  await expect(page.getByTestId('filter-line')).toContainText('筛选后共 1 张'); await expect(page.locator('.card[data-card-id]')).toHaveCount(1);
  await page.getByTestId('filter-line').getByRole('button', { name: '清除' }).click(); await expect(page.locator('.card[data-card-id]')).toHaveCount(readingOrder.length);
});
test('阶段筛选只在两张临床知识卡中随机，工具不混入', async ({ page }) => {
  await page.getByRole('group', { name: '阶段' }).getByRole('button', { name: '临床', exact: true }).click(); await expect(page.locator('.card[data-card-id]')).toHaveCount(2);
  const ids = await page.locator('.card[data-card-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card-id')));
  expect(ids.sort()).toEqual(['K056', 'K057']);
});
test('仅看未读下标为已读，当前卡和队列不会立刻变化', async ({ page }) => {
  await page.getByTestId('open-filter').click(); const sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await sheet.getByRole('button', { name: /未读/ }).first().click(); await sheet.getByTestId('apply-filters').click();
  const card = page.locator('.card[data-card-id]').first(); const id = await card.getAttribute('data-card-id');
  const before = await page.locator('.card[data-card-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card-id')));
  await card.getByRole('button', { name: '标已读' }).click(); await expect(page.locator(`.card[data-card-id="${id}"]`)).toBeVisible();
  expect(await page.locator('.card[data-card-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card-id')))).toEqual(before);
});
test('我的页：导出 → 清除需确认 → 导入恢复', async ({ page }) => {
  await page.locator(`.card[data-card-id="${first}"]`).getByRole('button', { name: '收藏' }).click(); await page.goto('/#/me'); await expect(page.getByTestId('me')).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '导出备份' }).click()]); const path = await download.path(); expect(path).toBeTruthy();
  await page.getByRole('button', { name: '清除本地数据' }).click(); await expect(page.getByTestId('clear-sheet')).toBeVisible(); await page.getByRole('button', { name: '取消' }).click();
  expect(await page.evaluate(() => localStorage.getItem('lakang:v1'))).toContain(first);
  await page.getByRole('button', { name: '清除本地数据' }).click(); await page.getByTestId('confirm-clear').click(); await expect(page.getByTestId('me-message')).toHaveText('已清除。'); await expect(page.getByText('收藏 0 张')).toBeVisible();
  await page.getByTestId('import-file').setInputFiles(path!); await expect(page.getByTestId('import-sheet')).toBeVisible(); await page.getByRole('button', { name: '合并导入' }).click(); await expect(page.getByText('收藏 1 张')).toBeVisible();
});
test('导入非本站文件被拒绝且不改动数据', async ({ page }) => {
  await page.goto('/#/me'); await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByTestId('me-message')).toBeVisible(); await expect(page.getByTestId('import-sheet')).toBeHidden();
});
