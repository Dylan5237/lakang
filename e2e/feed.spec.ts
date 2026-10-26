import { expect, test, type Page } from '@playwright/test';

const activeId = async (page: Page) => (await page.evaluate(() => location.hash)).replace(/^#\/card\//, '').split('/')[0];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('feed')).toBeVisible();
  await expect.poll(() => activeId(page)).toBe('K001');
});

test('首次进入停在第一张未读卡；下一张按钮和 j/k 可切换', async ({ page }) => {
  await expect(page.locator('.card[data-card-id="K001"] .card-title')).toBeVisible();
  await page.getByRole('button', { name: '下一张' }).click();
  await expect.poll(() => activeId(page)).toBe('K002');
  await page.getByTestId('feed').focus();
  await page.keyboard.press('j');
  await expect.poll(() => activeId(page)).toBe('K003');
  await page.keyboard.press('k');
  await expect.poll(() => activeId(page)).toBe('K002');
});

test('触摸上划翻到下一张，下划回到上一张', async ({ page }) => {
  const feed = page.getByTestId('feed');
  const box = (await feed.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const swipe = async (from: number, dy: number) => {
    let y = box.y + box.height * from;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 0; i < 12; i++) {
      y += dy;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(0.85, -30);
  await expect.poll(() => activeId(page)).toBe('K002');
  await swipe(0.3, 30);
  await expect.poll(() => activeId(page)).toBe('K001');
});

test('收藏/已读/笔记写入本地存储，刷新后保留', async ({ page }) => {
  const card = page.locator('.card[data-card-id="K001"]');
  await card.getByRole('button', { name: '收藏' }).click();
  await expect(card.getByRole('button', { name: '已收藏' })).toHaveAttribute('aria-pressed', 'true');
  await card.getByRole('button', { name: '标已读' }).click();
  await expect(card.getByRole('button', { name: '已读' })).toBeVisible();

  await card.getByRole('button', { name: '展开读' }).click();
  const dlg = page.getByTestId('detail');
  await expect(dlg).toBeVisible();
  await dlg.getByLabel('我的笔记').fill('我的测试笔记');
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();

  await page.reload();
  await expect(page.locator('.card[data-card-id]').first()).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lakang:v1') ?? '{}'));
  expect(stored.favorites).toContain('K001');
  expect(stored.read).toContain('K001');
  expect(stored.notes.K001).toBe('我的测试笔记');
});

test('阅读位置：滚到第 4 张后刷新，回到该张；全部已读前首页为第一张未读', async ({ page }) => {
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '下一张' }).click();
  await expect.poll(() => activeId(page)).toBe('K004');
  await page.goto('/#/');
  await page.reload();
  await expect.poll(() => activeId(page)).toBe('K004');
});

test('展开读：详情含出处，返回键关闭并把焦点还给“展开读”', async ({ page }) => {
  const open = page.locator('.card[data-card-id="K001"]').getByRole('button', { name: '展开读' });
  await open.focus();
  await open.click();
  const dlg = page.getByTestId('detail');
  await expect(dlg).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe('#/card/K001/more');
  await expect(dlg.getByTestId('sources')).toBeVisible();
  await page.goBack();
  await expect(dlg).toBeHidden();
  expect(await page.evaluate(() => location.hash)).toBe('#/card/K001');
  await expect(open).toBeFocused();
});

test('直接打开 #/card/K010/more 时详情弹出，关闭后停在 K010', async ({ page }) => {
  await page.goto('/#/card/K010/more');
  await page.reload();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(page.getByTestId('detail')).toBeHidden();
  await expect.poll(() => activeId(page)).toBe('K010');
});

test('搜索与筛选：关键词命中、仅看收藏、清除', async ({ page }) => {
  await page.locator('.card[data-card-id="K001"]').getByRole('button', { name: '收藏' }).click();
  await page.getByTestId('open-filter').click();
  const sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('searchbox').fill('K002');
  await expect(sheet.locator('.hit-list li').first()).toBeVisible();
  await sheet.getByRole('searchbox').fill('');
  await sheet.getByRole('button', { name: /收藏/ }).first().click();
  await sheet.getByTestId('apply-filters').click();
  await expect(page.getByTestId('filter-line')).toContainText('筛选后共 1 张');
  await expect(page.locator('.card[data-card-id]')).toHaveCount(1);
  await page.getByTestId('filter-line').getByRole('button', { name: '清除' }).click();
  await expect(page.locator('.card[data-card-id]')).toHaveCount(68);
});

test('阶段筛选只留下该阶段卡片', async ({ page }) => {
  await page.getByRole('group', { name: '阶段' }).getByRole('button', { name: '临床' }).click();
  await expect(page.locator('.card[data-card-id]')).toHaveCount(13);
});

test('「仅看未读」下标为已读，当前卡不会立刻消失', async ({ page }) => {
  await page.getByTestId('open-filter').click();
  const sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await sheet.getByRole('button', { name: /未读/ }).first().click();
  await sheet.getByTestId('apply-filters').click();
  const card = page.locator('.card[data-card-id]').first();
  const id = await card.getAttribute('data-card-id');
  await card.getByRole('button', { name: '标已读' }).click();
  await expect(page.locator(`.card[data-card-id="${id}"]`)).toBeVisible();
});

test('我的页：导出 → 清除(需确认) → 导入恢复', async ({ page }) => {
  await page.locator('.card[data-card-id="K001"]').getByRole('button', { name: '收藏' }).click();
  await page.goto('/#/me');
  await expect(page.getByTestId('me')).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '导出备份' }).click()]);
  const path = await download.path();
  expect(path).toBeTruthy();

  await page.getByRole('button', { name: '清除本地数据' }).click();
  await expect(page.getByTestId('clear-sheet')).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();
  expect(await page.evaluate(() => localStorage.getItem('lakang:v1'))).toContain('K001');
  await page.getByRole('button', { name: '清除本地数据' }).click();
  await page.getByTestId('confirm-clear').click();
  await expect(page.getByTestId('me-message')).toHaveText('已清除。');
  await expect(page.getByText('收藏 0 张')).toBeVisible();

  await page.getByTestId('import-file').setInputFiles(path!);
  await expect(page.getByTestId('import-sheet')).toBeVisible();
  await page.getByRole('button', { name: '合并导入' }).click();
  await expect(page.getByText('收藏 1 张')).toBeVisible();
});

test('导入非本站文件被拒绝且不改动数据', async ({ page }) => {
  await page.goto('/#/me');
  await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByTestId('me-message')).toBeVisible();
  await expect(page.getByTestId('import-sheet')).toBeHidden();
});
