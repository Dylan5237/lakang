import { test, expect } from '@playwright/test';
import { cardById, termById, pathById } from '../src/lib/study';

test('全站冒烟：无控制台错误，内部链接可达', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const routes = ['#/', '#/paths', '#/paths/start-body', '#/terms', '#/terms/T27', '#/cards', '#/cards/K011', '#/review', '#/me', '#/about', '#/ai', '#/case/case1'];
  for (const r of routes) {
    await page.goto('/' + r);
    await page.waitForTimeout(120);
    await expect(page.locator('main').first()).toBeVisible();
    // every internal hash link must point at a route we can parse
    const bad = await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#/"]')]
      .map((a) => a.getAttribute('href')!)
      .filter((h) => !/^#\/($|paths(\/[\w-]+)?$|terms(\/T\d+)?$|cards(\/K\d+)?$|review$|me$|about$|ai$|case\/case\d(\/s\/c\d+s\d+|\/notes)?$)/.test(h)));
    expect(bad, r).toEqual([]);
  }
  // deepest content links resolve to real records
  await page.goto('/#/cards/K011');
  await expect(page.locator('.sCard.on .fig-svg')).toBeVisible();
  await page.goto('/#/paths');
  const count = await page.locator('.path-card').count();
  expect(count).toBe(pathById.size);
  expect(cardById.size).toBeGreaterThan(60);
  expect(termById.size).toBeGreaterThan(30);
  expect(errors).toEqual([]);
});
