import { expect, test, type Page } from '@playwright/test';
import readingOrder from '../content/reading-order.json';
const sizes = [
  { name: '320x640', width: 320, height: 640 }, { name: '375x667', width: 375, height: 667 }, { name: '390x844', width: 390, height: 844 }, { name: '430x932', width: 430, height: 932 }, { name: '横屏 667x375', width: 667, height: 375 }, { name: '横屏 844x390', width: 844, height: 390 },
];
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw=document.documentElement.clientWidth, bad:string[]=[];
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      if(el.closest('.stage-row, .tabs, dialog:not([open])')) return;
      const r=el.getBoundingClientRect(); if(r.width===0 || r.height===0) return;
      if(r.right>vw+1 || r.left< -1) bad.push(`${el.tagName}.${el.className} right=${Math.round(r.right)}`);
    });
    return { docScroll:document.documentElement.scrollWidth-vw, bodyScroll:document.body.scrollWidth-vw, bad:bad.slice(0,5) };
  });
}
async function smallTargets(page:Page,selector:string,min=40) {
  return page.evaluate(([sel,m]) => [...document.querySelectorAll<HTMLElement>(sel as string)].filter((e)=>e.offsetParent!==null).map((e)=>({t:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,8),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})).filter((x)=>x.w<(m as number)||x.h<(m as number)),[selector,min] as const);
}
for(const size of sizes) {
  test.describe(size.name,()=>{
    test.use({viewport:{width:size.width,height:size.height}});
    for(const level of [0,3]) {
      test(`全部页面无横向溢出，触控目标 ≥40px（字号档 ${level}）`,async({page})=>{
        await page.goto('/#/me'); await page.getByRole('button',{name:level===0?'标准':'特大'}).click();
        for(const h of ['#/','#/agenda/all','#/agenda/28','#/guide','#/guide/speakers','#/guide/terms','#/guide/shelf','#/me']) {
          await page.goto('/'+h); await expect(page.locator('main').first()).toBeVisible(); expect(await horizontalOverflow(page),`${h} 横向溢出`).toEqual({docScroll:0,bodyScroll:0,bad:[]});
        }
        await page.goto('/#/'); expect(await smallTargets(page,'.act, .icon-btn, .bottom-nav a, .chip')).toEqual([]);
      });
    }
    test('全部100张文字不横向溢出，操作按钮可达',async({page})=>{
      await page.goto('/#/'); await expect(page.getByTestId('feed')).toBeVisible();
      const stats=await page.evaluate(()=>{
        const feed=document.querySelector<HTMLElement>('[data-testid="feed"]')!,vh=feed.clientHeight; let taller=0,maxRatio=0;const overflowing:string[]=[];
        feed.querySelectorAll<HTMLElement>('.card[data-card-id]').forEach(c=>{
          if(c.offsetHeight>vh+1)taller++;maxRatio=Math.max(maxRatio,c.offsetHeight/vh);
          c.querySelectorAll<HTMLElement>('*').forEach(e=>{if(e instanceof SVGElement && !(e instanceof SVGSVGElement))return;if(e.scrollWidth>e.clientWidth+1 && getComputedStyle(e).display!=='inline')overflowing.push(`${c.dataset.cardId}:${e.className}`);});
        });
        return {count:feed.querySelectorAll('.card[data-card-id]').length,taller,maxRatio:Number(maxRatio.toFixed(2)),overflowing:overflowing.slice(0,5),vh};
      });
      test.info().annotations.push({type:'卡片高度统计',description:JSON.stringify(stats)});expect(stats.count).toBe(readingOrder.length);expect(stats.overflowing).toEqual([]);
    });
  });
}
for(const size of sizes) {
  test(`${size.name}：高卡片操作栏固定在可视区`,async({page})=>{
    await page.setViewportSize({width:size.width,height:size.height});await page.goto('/#/card/K026');const card=page.locator('.card[data-card-id="K026"]');await expect(card).toBeVisible();
    const feed=page.getByTestId('feed'),fb=(await feed.boundingBox())!,ab=(await card.locator('.actions').boundingBox())!;
    expect(ab.y+ab.height).toBeLessThanOrEqual(fb.y+fb.height+1);await expect(card.getByRole('button',{name:'展开读'})).toBeInViewport({ratio:1});
    await feed.evaluate(e=>e.scrollBy(0,400));await expect(card.locator('.takeaway')).toBeVisible();
  });
}
for(const width of [320,390]) {
  test(`${width}宽特大字号：三环图完整位于卡片与详情内`,async({page})=>{
    await page.setViewportSize({width,height:700});await page.goto('/#/me');await page.getByRole('button',{name:'特大'}).click();await page.goto('/#/card/K011');
    const card=page.locator('.card[data-card-id="K011"]'),fig=card.locator('.fig-svg');await fig.scrollIntoViewIfNeeded();await expect(fig).toBeVisible();await expect(fig).toHaveAttribute('aria-label',/博罗米三环.*图/);
    const fb=(await fig.boundingBox())!,cb=(await card.boundingBox())!;expect(fb.width).toBeGreaterThan(150);expect(fb.x).toBeGreaterThanOrEqual(cb.x);expect(fb.x+fb.width).toBeLessThanOrEqual(cb.x+cb.width+1);
    const outside=await fig.evaluate((svg:SVGSVGElement)=>{const vb=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].map(t=>({t:t.textContent,b:t.getBBox()})).filter(({b})=>b.x<vb.x||b.y<vb.y||b.x+b.width>vb.x+vb.width||b.y+b.height>vb.y+vb.height).map(({t})=>t);});
    expect(await card.locator('.fig-svg text').count()).toBeGreaterThanOrEqual(5);expect(outside).toEqual([]);
    await page.goto('/#/card/K011/more');const dfig=page.getByTestId('detail').locator('.fig');await dfig.scrollIntoViewIfNeeded();await expect(dfig.locator('.fig-credit')).toContainText('Lacan-Mathemes');expect(await horizontalOverflow(page)).toEqual({docScroll:0,bodyScroll:0,bad:[]});
  });
}
