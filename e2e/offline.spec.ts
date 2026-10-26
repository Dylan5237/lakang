import { chromium, expect, test } from '@playwright/test';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyDist, serve } from './server';
const cleanup = (path: string) => { try { rmSync(path, { recursive:true, force:true, maxRetries:5, retryDelay:300 }); } catch { /* OS may still hold a temporary browser file. */ } };
const channel = process.env.PW_CHANNEL === undefined ? 'msedge' : process.env.PW_CHANNEL || undefined;
const PREFIX='/lakang/';
test('离线冷启动：卡片、六组专题、长篇正文、日程与许可均可读', async()=>{
  const root=copyDist(),srv=await serve(root,PREFIX),profile=mkdtempSync(join(tmpdir(),'lakang-profile-'));
  const opts={channel,locale:'zh-CN',viewport:{width:390,height:844},serviceWorkers:'allow'} as const;
  try {
    let ctx=await chromium.launchPersistentContext(profile,opts);let page=ctx.pages()[0]??(await ctx.newPage());
    await page.goto(srv.url);await expect(page.getByTestId('offline-pill')).toBeVisible({timeout:30_000});
    const initial = await page.evaluate(()=>location.hash.replace(/^#\/card\//,'').split('/')[0]);
    await page.goto(srv.url+'#/me');await expect(page.getByTestId('offline-state')).toContainText('离线已就绪');await ctx.close();
    await srv.close();ctx=await chromium.launchPersistentContext(profile,opts);page=ctx.pages()[0]??(await ctx.newPage());
    await page.goto(srv.url);await expect(page.locator(`.card[data-card-id="${initial}"] .card-title`)).toBeVisible();await expect(page.getByTestId('offline-pill')).toBeVisible();
    await page.goto(srv.url+'#/agenda/all');await expect(page.getByTestId('overview').locator('li')).toHaveCount(15);
    await page.goto(srv.url+'#/card/K020/more');await page.reload();await expect(page.getByTestId('detail').getByTestId('sources')).toBeVisible();
    await page.goto(srv.url+'#/card/K011/more');await expect(page.getByTestId('detail').locator('.fig-svg')).toBeVisible();await expect(page.getByTestId('detail').locator('.fig-credit a',{hasText:'MIT 许可'})).toBeVisible();
    expect(await page.evaluate(()=>fetch('licenses/lacan-mathemes-MIT.txt').then(r=>r.text()))).toContain('Graham Joncas');
    await page.goto(srv.url+'#/guide/series');await expect(page.locator('[data-series-id]')).toHaveCount(6);
    await page.goto(srv.url+'#/card/K074/more');await page.reload();await expect(page.getByTestId('detail').locator('.detail-text h3')).toHaveCount(5);
    await page.getByTestId('series-nav').getByRole('link',{name:/下一篇/}).click();await expect.poll(()=>page.evaluate(()=>location.hash)).toBe('#/card/K075/more');
    await ctx.close();
  } finally {await srv.close().catch(()=>undefined);cleanup(profile);cleanup(root);}
});
test('缓存更新：新版sw上线后提示，确认后接管并重载',async()=>{
  const root=copyDist(),srv=await serve(root,PREFIX),browser=await chromium.launch({channel});
  try {
    const ctx=await browser.newContext({locale:'zh-CN',viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await ctx.newPage();
    await page.goto(srv.url);await expect(page.getByTestId('offline-pill')).toBeVisible({timeout:30_000});await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);await expect(page.locator('.update-bar')).toHaveCount(0);
    appendFileSync(join(root,'sw.js'),'\n// release-2\n');await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg?.update();});
    await expect(page.locator('.update-bar')).toContainText('有新版本可用',{timeout:20_000});await page.locator('.update-bar').getByRole('button',{name:'更新'}).click();
    await expect(page.locator('.update-bar')).toHaveCount(0,{timeout:20_000});await expect(page.getByTestId('feed')).toBeVisible();await ctx.close();
  } finally {await browser.close();await srv.close();cleanup(root);}
});
