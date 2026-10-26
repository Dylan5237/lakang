import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const canonical = JSON.parse(readFileSync(new URL('../content/reading-order.json', import.meta.url), 'utf8')) as string[];
const ids = (page: Page) => page.locator('.card[data-card-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card-id')!));
const active = (page: Page) => page.evaluate(() => location.hash.replace(/^#\/card\//, '').split('/')[0]);

test('首次进入随机排列全部100卡；下一张不采用固定学习顺序', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.37; });
  await page.goto('/'); await expect(page.locator('.card[data-card-id]')).toHaveCount(100);
  const deck = await ids(page);
  expect(deck).not.toEqual(canonical); expect(deck[0]).not.toBe('K001');
  expect(new Set(deck).size).toBe(100); expect([...deck].sort()).toEqual([...canonical].sort());
  await expect.poll(() => active(page)).toBe(deck[0]);
  await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[1]);
  await page.getByRole('button', { name: '上一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[0]);
});

test('刷新和离开再返回保留队列、位置与下一张；标记不重新洗牌', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await expect(page.locator('.card[data-card-id]')).toHaveCount(100);
  const deck = await ids(page);
  for (let i = 1; i <= 3; i++) { await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[i]); }
  const card = page.locator(`.card[data-card-id="${deck[3]}"]`);
  await card.getByRole('button', { name: '收藏', exact: true }).click();
  await card.getByRole('button', { name: '标已读', exact: true }).click(); expect(await ids(page)).toEqual(deck);
  await page.reload(); await expect.poll(() => active(page)).toBe(deck[3]); expect(await ids(page)).toEqual(deck);
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '前瞻', exact: true }).click();
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '卡片', exact: true }).click();
  await expect.poll(() => active(page)).toBe(deck[3]); expect(await ids(page)).toEqual(deck);
  await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[4]);
});

test('官方前瞻筛选在18张中随机、一轮无重复，末张继续进入新一轮', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await page.getByRole('group', { name: '阶段' }).getByRole('button', { name: '官方前瞻', exact: true }).click();
  await expect(page.locator('.card[data-card-id]')).toHaveCount(18);
  const deck = await ids(page); const visited: string[] = [];
  expect([...deck].sort()).toEqual(Array.from({ length: 18 }, (_, i) => `K${104 + i}`));
  for (let i = 0; i < deck.length; i++) {
    await expect.poll(() => active(page)).toBe(deck[i]); visited.push(await active(page));
    if (i < deck.length - 1) await page.getByRole('button', { name: '下一张', exact: true }).click();
  }
  expect(new Set(visited).size).toBe(18);
  await page.getByRole('button', { name: '下一张', exact: true }).click();
  await expect.poll(() => active(page)).not.toBe(deck.at(-1));
  const nextDeck = await ids(page); expect(new Set(nextDeck).size).toBe(18);
  expect([...nextDeck].sort()).toEqual([...deck].sort()); await expect.poll(() => active(page)).toBe(nextDeck[0]);
});

test('末页按钮可以再随机一轮，仍然只在当前范围内', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await page.getByRole('group', { name: '阶段' }).getByRole('button', { name: '临床', exact: true }).click();
  await expect(page.locator('.card[data-card-id]')).toHaveCount(2);
  const deck = await ids(page);
  await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[1]);
  await page.getByRole('button', { name: '再随机一轮', exact: true }).click();
  await expect.poll(() => active(page)).toBe(deck[0]); expect((await ids(page)).sort()).toEqual(['K056', 'K057']);
});

test('禁用sessionStorage仍可随机刷卡，空筛选与单卡无错误', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } }); });
  await page.goto('/'); await expect(page.locator('.card[data-card-id]')).toHaveCount(100);
  const deck = await ids(page); await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe(deck[1]);
  await page.getByTestId('open-filter').click(); let sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await sheet.getByRole('searchbox').fill('NORESULT_RANDOM_FEED'); await sheet.getByTestId('apply-filters').click();
  await expect(page.getByRole('heading', { name: '没有符合条件的卡片' })).toBeVisible();
  await page.getByRole('button', { name: '下一张', exact: true }).click();
  await page.getByTestId('open-filter').click(); sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await sheet.getByRole('searchbox').fill('K121'); await sheet.getByTestId('apply-filters').click();
  await expect(page.locator('.card[data-card-id]')).toHaveCount(1); await expect.poll(() => active(page)).toBe('K121');
  await page.getByRole('button', { name: '下一张', exact: true }).click(); await expect.poll(() => active(page)).toBe('K121');
  expect(errors).toEqual([]);
});
