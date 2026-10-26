import { expect, test } from '@playwright/test';

test('六组专题可进入，分节精读可前后衔接且切篇回到顶部', async ({ page }) => {
  await page.goto('/#/guide');
  await expect(page.locator('[data-series-id]')).toHaveCount(6);
  const series = page.locator('[data-series-id="desire"]');
  await expect(series.locator('ol li')).toHaveCount(5);
  await series.getByRole('link', { name: '开始阅读', exact: true }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/card/K074');
  await page.locator('.card[data-card-id="K074"]').getByRole('button', { name: '展开读' }).click();
  const detail = page.getByTestId('detail');
  await expect(detail.locator('.detail-text h3')).toHaveCount(5);
  await detail.getByTestId('series-nav').getByRole('link', { name: /下一篇/ }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/card/K075/more');
  await expect.poll(() => detail.locator('.sheet-scroll').evaluate((el) => el.scrollTop)).toBe(0);
  await detail.getByTestId('series-nav').getByRole('link', { name: /上一篇/ }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/card/K074/more');
  await detail.getByTestId('series-nav').getByRole('link', { name: '返回专题目录' }).click();
  await expect(page.getByTestId('study-paths')).toBeVisible();
});

test('专题已读使用原有存储，继续入口指向下一篇未读', async ({ page }) => {
  await page.goto('/#/card/K074/more');
  const detail = page.getByTestId('detail');
  await detail.getByRole('button', { name: '标为已读', exact: true }).click();
  await detail.getByLabel('我的笔记').fill('新专题笔记');
  await page.goto('/#/guide/series');
  const series = page.locator('[data-series-id="desire"]');
  await expect(series).toContainText('已读1/5');
  await expect(series.getByRole('link', { name: '继续专题' })).toHaveAttribute('href', '#/card/K075');
  await page.reload();
  await expect(series).toContainText('已读1/5');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lakang:v1')!));
  expect(saved.read).toContain('K074'); expect(saved.notes.K074).toBe('新专题笔记');
});

test('新术语与精读反链、新正文均可搜索', async ({ page }) => {
  await page.goto('/#/guide/terms');
  await expect(page.getByTestId('term-list').locator('li.entry')).toHaveCount(26);
  const term = page.getByTestId('term-list').locator('li.entry').filter({ has: page.getByRole('heading', { name: /逻辑时间/ }) });
  await term.locator('a').first().click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/card/K093');
  await page.getByTestId('open-filter').click();
  const sheet = page.getByRole('dialog', { name: '搜索与筛选' });
  await sheet.getByRole('searchbox').fill('三囚徒');
  await expect(sheet.locator('.hit-list')).toContainText('逻辑时间');
});

test('靛蓝浅深主题与自动主题同步浏览器栏，文字对比度达4.5', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/me');
  const vars = () => page.evaluate(() => { const c = getComputedStyle(document.documentElement); return { bg:c.getPropertyValue('--bg').trim(), fg:c.getPropertyValue('--fg').trim(), accent:c.getPropertyValue('--accent').trim(), accentFg:c.getPropertyValue('--accent-fg').trim(), muted:c.getPropertyValue('--muted').trim(), surface:c.getPropertyValue('--surface').trim(), soft:c.getPropertyValue('--accent-soft').trim(), meta:document.querySelector('meta[name="theme-color"]')?.getAttribute('content') }; });
  const luminance = (hex:string) => { const v=hex.replace('#','').match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4); return .2126*v[0]+.7152*v[1]+.0722*v[2]; };
  const ratio = (a:string,b:string) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  for (const [label, expected] of [['浅色','#34365c'],['深色','#b9bce8']]) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect.poll(async()=>(await vars()).accent).toBe(expected);
    const v=await vars(); expect(v.meta).toBe(v.bg);
    for (const [fg,bg] of [[v.fg,v.bg],[v.muted,v.surface],[v.accent,v.soft],[v.accentFg,v.accent]]) expect(ratio(fg,bg)).toBeGreaterThanOrEqual(4.5);
  }
  await page.getByRole('button',{name:'跟随系统'}).click();
  await page.emulateMedia({colorScheme:'dark'});
  await expect.poll(async()=>(await vars()).meta).toBe('#171923');
  await page.emulateMedia({colorScheme:'light'});
  await expect.poll(async()=>(await vars()).meta).toBe('#f7f6f2');
});

for (const width of [320,390]) {
  test(`${width}宽特大字号：所有精读章节可读且不横向溢出`, async ({ page }) => {
    await page.setViewportSize({width,height:700});
    await page.goto('/#/me'); await page.getByRole('button',{name:'特大',exact:true}).click();
    for (const id of ['K074','K081','K087','K093','K097','K102']) {
      await page.goto(`/#/card/${id}/more`);
      const detail=page.getByTestId('detail');
      await expect(detail.locator('.detail-text h3')).toHaveCount(5);
      const bad=await detail.locator('.sheet-scroll').evaluate((el)=>{ const r=el.getBoundingClientRect();return [...el.querySelectorAll<HTMLElement>('p,h3,a')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&(b.left<r.left-1||b.right>r.right+1);}).map(x=>x.tagName+':'+x.textContent?.slice(0,10)); });
      expect(bad,id).toEqual([]);
      await detail.getByTestId('series-nav').scrollIntoViewIfNeeded(); await expect(detail.getByTestId('series-nav')).toBeVisible();
    }
  });
}

test('不安全上下文不提示无限等待，明确说明离线不可用及备份迁移', async ({ page }) => {
  // Simulates the UI branch only; actual public HTTP/HTTPS deployment is a separate acceptance step.
  await page.addInitScript(() => Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true }));
  await page.goto('/#/me');
  await expect(page.getByTestId('offline-state')).toContainText('HTTP');
  await expect(page.getByTestId('offline-state')).not.toContainText('稍等');
  await expect(page.getByTestId('offline-panel')).toContainText('先在原地址导出备份');
});
