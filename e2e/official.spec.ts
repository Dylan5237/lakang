import { chromium, expect, test } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyDist, serve } from './server';
test('独立前瞻菜单、四篇文章、18官方卡与100主卡均可达',async({page})=>{
  await page.goto('/');await expect(page.locator('.card[data-card-id]')).toHaveCount(100);
  await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'前瞻',exact:true}).click();await expect(page.getByTestId('official-articles').locator('li')).toHaveCount(4);
  await page.locator('[data-article-id="P03"]').getByRole('link',{name:'卡片目录'}).click();await expect(page.getByTestId('official-article').locator('.article-card-list > li')).toHaveCount(5);await expect(page.getByRole('heading',{name:'摄入如何影响身体？',exact:true})).toBeVisible();
  await page.goto('/#/');await page.getByRole('group',{name:'阶段'}).getByRole('button',{name:'官方前瞻'}).click();await expect(page.locator('.card[data-card-id]')).toHaveCount(18);
});
test('提炼卡一键定位原文，后退回到原卡，不把提炼冒充原文',async({page})=>{
  await page.goto('/#/card/K114/more');const dlg=page.getByTestId('detail');await expect(dlg).toBeVisible();await dlg.getByRole('link',{name:'查看原文',exact:true}).click();
  await expect(page.getByTestId('official-original')).toBeVisible();await expect(page.locator('[data-paragraph-id="P03-03"]')).toHaveClass(/selected/);await expect(page.locator('[data-paragraph-id="P03-03"]')).toContainText('那么这一三界划分是否能够成立');await expect(page.getByTestId('official-original')).toContainText('原文 · 文字版');
  await page.goBack();await expect(page.getByTestId('detail')).toBeVisible();await expect(page.getByTestId('detail')).toContainText('一个待检验的三界框架');
});
test('文章内连续阅读、已读续读与原文全文',async({page})=>{
  await page.goto('/#/card/K108/more');const dlg=page.getByTestId('detail');await dlg.getByRole('button',{name:'标为已读',exact:true}).click();await dlg.getByTestId('official-next').click();await expect.poll(()=>page.evaluate(()=>location.hash)).toBe('#/card/K109/more');await expect(dlg.getByTestId('official-previous')).toBeVisible();
  await page.goto('/#/previews');await expect(page.locator('[data-article-id="P02"]').getByRole('link',{name:'继续读卡'})).toHaveAttribute('href','#/card/K109/more');
  await page.goto('/#/previews/P02/original');await expect(page.locator('.source-paragraph')).toHaveCount(6);await expect(page.getByTestId('official-original')).toContainText('我们辅以抗抑郁药物治疗，同时维持每周两次的精神分析会谈');
});
test('旧卡收藏笔记保留，附录可读，主流进度不受附录污染',async({page})=>{
  await page.goto('/');await page.evaluate(()=>localStorage.setItem('lakang:v1',JSON.stringify({version:1,favorites:['K064'],read:['K064'],notes:{K064:'旧卡原有笔记'},position:'K064',settings:{theme:'light',fontLevel:0}})));await page.reload();
  await page.goto('/#/me');await expect(page.getByText('已读 0 / 100 张',{exact:false})).toBeVisible();await expect(page.getByText('旧卡原有笔记')).toBeVisible();await page.getByRole('link',{name:/一页笔记/}).click();await expect(page.getByTestId('detail').getByLabel('我的笔记')).toHaveValue('旧卡原有笔记');await expect(page.getByTestId('detail').getByTestId('archive-note')).toBeVisible();
  await page.goto('/#/');await page.getByTestId('open-filter').click();const sheet=page.getByRole('dialog',{name:'搜索与筛选'});await sheet.getByRole('button',{name:/仅看收藏/}).click();await sheet.getByRole('searchbox').fill('K064');await expect(sheet.locator('.hit-list li')).toHaveCount(1);await sheet.getByTestId('apply-filters').click();await expect(page.locator('.card[data-card-id="K064"]')).toBeVisible();
  await page.goto('/#/previews/appendix');await expect(page.getByTestId('appendix').locator('.entries > li')).toHaveCount(18);
});
for(const width of [320,390])test(`${width}宽特大字号：前瞻目录、原文和五项菜单不溢出`,async({page})=>{
  await page.setViewportSize({width,height:700});await page.goto('/#/me');await page.getByRole('button',{name:'特大',exact:true}).click();
  for(const hash of ['#/previews','#/previews/P01','#/previews/P02/original','#/previews/P03/original/P03-06','#/previews/appendix']){
    await page.goto('/'+hash);await expect(page.locator('main')).toBeVisible();
    const overflow=await page.locator('main').evaluate((main)=>({page:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:main.scrollWidth-main.clientWidth}));expect(overflow,hash).toEqual({page:0,main:0});
    const nav=await page.locator('.bottom-nav a').evaluateAll((els)=>els.map((e)=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,right:r.right};}));expect(nav).toHaveLength(5);for(const r of nav){expect(r.w).toBeGreaterThanOrEqual(40);expect(r.h).toBeGreaterThanOrEqual(40);expect(r.right).toBeLessThanOrEqual(width+1);}
  }
});
test('原文及附录离线冷启动：服务器关闭后仍能读，笔记仍属于旧卡',async()=>{
  const root=copyDist();const srv=await serve(root,'/lakang/');const profile=mkdtempSync(join(tmpdir(),'lakang-originals-'));const channel=process.env.PW_CHANNEL===undefined?'msedge':process.env.PW_CHANNEL||undefined;
  let ctx: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
  try{
    ctx=await chromium.launchPersistentContext(profile,{channel,locale:'zh-CN',viewport:{width:390,height:844},serviceWorkers:'allow'});let page=ctx.pages()[0]??await ctx.newPage();await page.goto(srv.url);await expect(page.getByTestId('offline-pill')).toBeVisible({timeout:30000});await ctx.close();ctx=undefined;await srv.close();
    ctx=await chromium.launchPersistentContext(profile,{channel,locale:'zh-CN',viewport:{width:390,height:844},serviceWorkers:'allow'});page=ctx.pages()[0]??await ctx.newPage();await page.goto(srv.url+'#/previews/P03/original');await expect(page.getByTestId('official-original')).toContainText('原初的食人式认同');await expect(page.locator('.source-paragraph')).toHaveCount(6);
    await page.goto(srv.url+'#/card/K112/more');await expect(page.getByTestId('detail')).toContainText('抗抑郁药物');await page.goto(srv.url+'#/card/K064/more');await page.getByTestId('detail').getByLabel('我的笔记').fill('附录离线笔记');await page.reload();await expect(page.getByTestId('detail').getByLabel('我的笔记')).toHaveValue('附录离线笔记');await page.goto(srv.url+'#/previews');await expect(page.getByTestId('official-articles').locator('li')).toHaveCount(4);
  }finally{await ctx?.close();await srv.close().catch(()=>undefined);rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300});rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:300});}
});
