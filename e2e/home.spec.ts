import { expect, test } from '@playwright/test';
import { studyOrder } from './study-ids';

test('学习首页：四步路径、底部六项导航，旧链接仍可达', async ({ page }) => {
  await page.goto('/');
  const home = page.getByTestId('home');
  await expect(home.getByRole('heading', { name: '拉康随身读', level: 1 })).toBeVisible();
  await expect(page.getByTestId('learning-steps').locator('> li')).toHaveCount(4);
  await expect(home).toContainText(`已读 0 / ${studyOrder.length} 张`);
  const nav = page.getByRole('navigation', { name: '主导航' });
  await expect(nav.getByRole('link')).toHaveText(['学习', '卡片', '专题', '术语', '临床', '我的']);
  await expect(nav.getByRole('link', { name: '学习' })).toHaveAttribute('aria-current', 'page');

  await page.locator('[data-step-id="start"]').getByRole('link', { name: '开始' }).click();
  await expect(page.getByTestId('feed')).toBeVisible();
  await expect(nav.getByRole('link', { name: '卡片' })).toHaveAttribute('aria-current', 'page');
  const id = await page.evaluate(() => location.hash.replace(/^#\/card\//, '').split('/')[0]);
  await page.goto('/');
  await expect(page.getByTestId('resume').getByRole('link')).toHaveAttribute('href', `#/card/${id}`);

  await page.goto('/#/guide/terms'); await expect(page.getByTestId('terms')).toBeVisible();
  await page.goto('/#/guide/speakers'); await expect(page.getByTestId('archive').getByTestId('speaker-list').locator('> li')).toHaveCount(10);
  await page.goto('/#/agenda'); await expect(nav.getByRole('link', { name: '学习' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('link', { name: '返回大会归档' }).click(); await expect(page.getByTestId('archive')).toBeVisible();
});
