import { chromium, expect, test } from '@playwright/test';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyDist, serve } from './server';

const cleanup = (path: string) => {
  try {
    rmSync(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch {
    /* Windows 下浏览器偶尔仍占用临时目录；残留在系统临时目录，无害 */
  }
};

const channel = process.env.PW_CHANNEL === undefined ? 'msedge' : process.env.PW_CHANNEL || undefined;
const PREFIX = '/lakang/';

test('离线冷启动：联网访问一次 → 关闭浏览器 → 断网重开仍能阅读卡片与日程(子路径部署)', async () => {
  const root = copyDist();
  const srv = await serve(root, PREFIX);
  const profile = mkdtempSync(join(tmpdir(), 'lakang-profile-'));
  const opts = { channel, locale: 'zh-CN', viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' } as const;
  try {
    // 1) 联网首访
    let ctx = await chromium.launchPersistentContext(profile, opts);
    let page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto(srv.url);
    await expect(page.getByTestId('offline-pill')).toBeVisible({ timeout: 30_000 });
    await page.goto(srv.url + '#/me');
    await expect(page.getByTestId('offline-state')).toContainText('离线已就绪');
    await ctx.close();

    // 2) 服务器下线(真正的无网络)，重新启动浏览器冷启动
    await srv.close();
    ctx = await chromium.launchPersistentContext(profile, opts);
    page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto(srv.url);
    await expect(page.locator('.card[data-card-id="K001"] .card-title')).toBeVisible();
    await expect(page.getByTestId('offline-pill')).toBeVisible();
    await page.goto(srv.url + '#/agenda/all');
    await expect(page.getByTestId('overview').locator('li')).toHaveCount(15);
    await page.goto(srv.url + '#/card/K020/more');
    await page.reload();
    await expect(page.getByTestId('detail').getByTestId('sources')).toBeVisible();
    // K011 三环图与随图的 MIT 许可文本均可离线取得
    await page.goto(srv.url + '#/card/K011/more');
    await expect(page.getByTestId('detail').locator('.fig-svg')).toBeVisible();
    await expect(page.getByTestId('detail').locator('.fig-credit a', { hasText: 'MIT 许可' })).toBeVisible();
    const license = await page.evaluate(() => fetch('licenses/lacan-mathemes-MIT.txt').then((r) => r.text()));
    expect(license).toContain('Graham Joncas');
    await ctx.close();
  } finally {
    await srv.close().catch(() => undefined);
    cleanup(profile);
    cleanup(root);
  }
});

test('缓存更新：新版 sw 上线后出现“有新版本”，点更新后接管并重载', async () => {
  const root = copyDist();
  const srv = await serve(root, PREFIX);
  const browser = await chromium.launch({ channel });
  try {
    const ctx = await browser.newContext({ locale: 'zh-CN', viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
    const page = await ctx.newPage();
    await page.goto(srv.url);
    await expect(page.getByTestId('offline-pill')).toBeVisible({ timeout: 30_000 });
    // 首访安装完成后再访问一次，页面才被 SW 控制(与用户第二次打开一致)
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await expect(page.locator('.update-bar')).toHaveCount(0);

    // 改动 sw.js 字节，模拟部署了新版本
    appendFileSync(join(root, 'sw.js'), '\n// release-2\n');
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update();
    });
    await expect(page.locator('.update-bar')).toContainText('有新版本可用', { timeout: 20_000 });
    await page.locator('.update-bar').getByRole('button', { name: '更新' }).click();
    await expect(page.locator('.update-bar')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByTestId('feed')).toBeVisible();
    await ctx.close();
  } finally {
    await browser.close();
    await srv.close();
    cleanup(root);
  }
});
