import { expect, test, type Page } from '@playwright/test';

// 固定“当前时刻”为一个绝对瞬时点(UTC)，并让设备时区与上海无关
async function at(page: Page, iso: string) {
  await page.clock.install({ time: new Date(iso) });
}
const phase = (page: Page) => page.getByTestId('agenda-banner').getAttribute('data-phase');

for (const tz of ['Asia/Shanghai', 'America/Los_Angeles', 'Europe/London']) {
  test.describe(`设备时区 ${tz}`, () => {
    test.use({ timezoneId: tz });

    test('会前：横幅显示距开始天数，默认落在第一天', async ({ page }) => {
      await at(page, '2026-10-24T04:00:00Z'); // 北京 10/24 12:00
      await page.goto('/#/agenda');
      expect(await phase(page)).toBe('before');
      await expect(page.getByTestId('agenda-banner')).toContainText('距会议开始还有 3 天');
      await expect(page.getByTestId('day-view')).toContainText('19:30');
    });

    test('10/28 10:00(北京)：两场开幕演讲共享 09:30—12:00，横幅为进行中', async ({ page }) => {
      await at(page, '2026-10-28T02:00:00Z');
      await page.goto('/#/agenda');
      expect(await phase(page)).toBe('during');
      const live = page.locator('[data-session-id="d28-keynotes"]');
      await expect(live).toHaveAttribute('data-state', 'live');
      await expect(live).toContainText('09:30—12:00');
      await expect(live).toContainText('冼为坚国际会议中心');
    });

    test('10/29 14:30(北京)：会议楼Ⅱ 401 室，标注换场', async ({ page }) => {
      await at(page, '2026-10-29T06:30:00Z');
      await page.goto('/#/agenda');
      expect(await phase(page)).toBe('during');
      const s = page.locator('[data-session-id="d29-writing"]');
      await expect(s).toContainText('401');
      await expect(s.locator('.badge.change')).toBeVisible();
      await expect(page.locator('[data-session-id="d29-adolescent"]')).toHaveAttribute('data-state', 'past');
    });

    test('10/29 19:00(北京)：场间休息，下一场为晚间 20:00', async ({ page }) => {
      await at(page, '2026-10-29T11:00:00Z');
      await page.goto('/#/agenda');
      expect(await phase(page)).toBe('between');
      await expect(page.getByTestId('agenda-banner')).toContainText('20:00');
    });

    test('10/31 之后(北京 11/01)：已结束', async ({ page }) => {
      await at(page, '2026-11-01T01:00:00Z');
      await page.goto('/#/agenda');
      expect(await phase(page)).toBe('after');
      await expect(page.getByTestId('agenda-banner')).toContainText('会议日程已结束');
    });
  });
}

test('跨日边界：设备在美国 10/27 晚，北京已是 10/28 → 默认日为 28 日', async ({ browser }) => {
  const ctx = await browser.newContext({ timezoneId: 'America/Los_Angeles', locale: 'zh-CN', viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await at(page, '2026-10-28T01:00:00Z'); // 北京 09:00，洛杉矶 10/27 18:00
  await page.goto('/#/agenda');
  await expect(page.locator('[data-session-id="d28-opening"]')).toHaveAttribute('data-state', 'live');
  await ctx.close();
});

test('日程按天切换与 5 天总览；场次链接到卡片，卡片链接回场次', async ({ page }) => {
  await at(page, '2026-10-24T04:00:00Z');
  await page.goto('/#/agenda');
  const tabs = page.getByRole('tablist', { name: '按天查看' });
  await tabs.getByRole('tab', { name: /29/ }).click();
  await expect(page.locator('[data-session-id="d29-clinical"]')).toBeVisible();
  await tabs.getByRole('tab', { name: '总览' }).click();
  await expect(page.getByTestId('overview')).toBeVisible();
  await expect(page.getByTestId('overview').locator('li')).toHaveCount(15);

  await tabs.getByRole('tab', { name: /31/ }).click();
  const first = page.locator('[data-session-id="d31-equivocation"]');
  await first.locator('summary').click();
  await first.locator('.link-list a').first().click();
  await expect(page.getByTestId('feed')).toBeVisible();
  const id = (await page.evaluate(() => location.hash)).replace('#/card/', '');
  await expect(page.locator(`.card[data-card-id="${id}"] .card-sessions a`).first()).toBeVisible();
  await page.locator(`.card[data-card-id="${id}"] .card-sessions a`).first().click();
  await expect(page.getByTestId('agenda')).toBeVisible();
});
