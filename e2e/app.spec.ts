import { expect, test } from '@playwright/test';
import { cardOrder, studyCards } from '../src/lib/study';
import { KEY, archive, serveArchive, openCase } from './fixture';

test('案例锁屏：错误密码被拒；正确后进入；锁定后需重新输入', async ({ page }) => {
  await serveArchive(page);
  await page.goto('/#/case/case1');
  await page.getByTestId('key').fill('0000'); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('lock-error')).toHaveText('密码不对。');
  await page.getByTestId('key').fill(KEY); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('case')).toBeVisible();
  await page.reload(); await expect(page.getByTestId('talk')).toBeVisible(); // same session: no retyping
  await page.getByRole('link', { name: '返回学习首页' }).click();
  await expect(page.getByTestId('home').locator('[data-case-id]')).toHaveCount(archive().cases.length);
  await page.getByRole('button', { name: '锁定' }).click();
  await page.goto('/#/case/case1'); await expect(page.getByTestId('key')).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('虚构发言');
});

test('学习模块无需密码：首页入口、词典与概念卡直接可用', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('modules')).toBeVisible();
  await expect(page.getByTestId('locked-cases')).toBeVisible(); // clinical stays locked
  await page.getByTestId('module-terms').click();
  await expect(page.getByTestId('terms')).toBeVisible();
  await expect(page.getByTestId('terms').locator('.term-list li')).toHaveCount(32);
  await page.getByTestId('terms-filter').fill('除权');
  await expect(page.getByTestId('terms').locator('.term-list li')).toHaveCount(1);
  await page.getByTestId('terms').locator('.term-list a').click();
  await expect(page.getByTestId('term-detail')).toContainText('forclusion');
  await expect(page.getByTestId('term-detail').locator('.case-links a').first()).toBeVisible();
  await page.goto('/#/');
  await page.getByTestId('module-cards').click();
  await expect(page.getByTestId('cards')).toBeVisible();
});

test('术语案例回链：未解锁先到锁屏，解锁后落在对应节', async ({ page }) => {
  await serveArchive(page);
  await page.goto('/#/terms/T27');
  const link = page.getByTestId('term-detail').locator('.case-links a').first();
  await link.click();
  await expect(page.getByTestId('key')).toBeVisible();
  await page.getByTestId('key').fill(KEY); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('talk')).toBeVisible();
});

test('概念卡：滑动换卡、按钮翻卡、收藏持久、目录与K链接', async ({ page }) => {
  const active = page.locator('.sCard.on');
  await page.goto('/#/cards');
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${cardOrder[0]}`);
  await expect(active).toHaveAttribute('data-card-id', cardOrder[0]);
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${cardOrder[1]}`);
  await expect(page.getByRole('button', { name: '‹ 上一张' })).toBeEnabled();

  // scroll the deck: snap lands on the next card and the tracker follows
  // (real touch swipes are covered by the local Edge run; CDP touch is unreliable in headless-shell)
  await page.getByTestId('feed').evaluate((e, id) => e.scrollTo({ top: (e.querySelector(`[data-card-id="${id}"]`) as HTMLElement).offsetTop }), cardOrder[3]);
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${cardOrder[3]}`);

  await page.getByTestId('card-fav').click();
  await expect(page.getByTestId('card-fav')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${cardOrder[3]}`); // position kept
  await expect(page.getByTestId('card-fav')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('open-card-toc').click();
  await expect(page.getByTestId('card-toc').locator('ol > li button')).toHaveCount(studyCards.length);
  await page.getByTestId('card-toc').locator('button', { hasText: studyCards[studyCards.length - 1].title }).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${studyCards[studyCards.length - 1].id}`);
  expect(await page.getByRole('button', { name: '下一张 ›' }).isDisabled()).toBe(true);
  const withRef = studyCards.find((c) => /K\d{3}/.test(`${c.body} ${c.detail.join(' ')}`));
  if (withRef) {
    await page.goto('/#/cards/' + withRef.id);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/cards/${withRef.id}`);
    await active.locator('details > summary').click();
    await active.locator('.kref').first().click();
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe(`#/cards/${withRef.id}`);
  }
});

test('概念卡：术语与相关卡互链可达', async ({ page }) => {
  const withTerms = studyCards.find((c) => c.termIds.length > 0)!;
  await page.goto('/#/cards/' + withTerms.id);
  const active = page.locator('.sCard.on');
  await active.locator('details > summary').click();
  await active.locator('.chips-row .btn').first().click(); // a term chip
  await expect(page.getByTestId('term-detail')).toBeVisible();
});

test('闪卡复习：翻面评分、完成汇总、进度仅存本机', async ({ page }) => {
  await page.goto('/#/review');
  await expect(page.getByTestId('flip')).toBeVisible();
  const first = page.getByTestId('flip').locator('.front strong');
  await expect(first).toBeVisible();
  await page.getByTestId('flip').click();
  await expect(page.getByTestId('flip').locator('.back')).toBeVisible();
  await expect(page.getByRole('button', { name: '记得' })).toBeEnabled();
  await page.getByRole('button', { name: '忘了' }).click();
  await expect(page.getByTestId('review')).toContainText('2/12');
  for (let i = 1; i < 12; i++) { await page.getByTestId('flip').click(); await page.getByRole('button', { name: '很熟' }).click(); }
  await expect(page.getByTestId('review-done')).toBeVisible();
  await expect(page.getByTestId('review-done')).toContainText('记得 0');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lakang:review') ?? '{}'));
  expect(Object.keys(stored).length).toBe(12);
  expect(JSON.stringify(stored)).not.toContain('能指'); // ids and schedule only, no card text
  await page.reload();
  await expect(page.getByTestId('flip')).toBeVisible();
  await expect(page.getByTestId('review')).toContainText('1/12');
});

test('服务器无记录时提示不可用', async ({ page }) => {
  await serveArchive(page, null);
  await page.goto('/#/case/case1');
  await page.getByTestId('key').fill(KEY); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('lock-error')).toHaveText('记录暂不可用。');
});

test('对话：目录跳转、阅读位置记忆与继续阅读', async ({ page }) => {
  const c = archive().cases[0]; const target = c.sections[3];
  await openCase(page);
  await expect(page.getByTestId('talk')).toBeVisible();
  await page.getByTestId('open-toc').click();
  await page.getByTestId('toc').locator('button', { hasText: target.title }).click();
  await expect(page.getByTestId('toc')).toBeHidden();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/case/${c.id}/s/${target.id}`);
  await expect(page.getByTestId('open-toc')).toContainText(`4/${c.sections.length}`);
  await page.getByRole('link', { name: '返回学习首页' }).click();
  await page.locator(`[data-case-id="${c.id}"]`).getByRole('link', { name: '继续 · 第 4 节' }).click();
  await expect.poll(() => page.locator(`[data-section-id="${target.id}"] .sec-head`).evaluate((h) => h.getBoundingClientRect().top)).toBeLessThan(260);
});

test('搜索：高亮命中、计数并跳到命中处', async ({ page }) => {
  test.skip(Boolean(process.env.LAKANG_REAL_JSON), '虚构数据专用');
  await openCase(page);
  await page.getByRole('button', { name: '搜索' }).click();
  await page.getByTestId('search').fill('父亲');
  await expect(page.getByTestId('search-count')).toHaveText('1/1');
  await expect(page.locator('mark', { hasText: '父亲' })).toBeVisible();
  await expect(page.locator('.turn.current')).toBeInViewport();
  await page.getByTestId('search').fill('不存在的词'); await expect(page.getByTestId('search-count')).toHaveText('无结果');
});

test('要点：人物图例、长卡展开、引语，切回对话', async ({ page }) => {
  await openCase(page, '#/case/case1/notes');
  const notes = page.getByTestId('notes');
  await expect(notes.locator('.legend li')).toHaveCount(archive().cases[0].legend.length);
  const more = notes.getByRole('button', { name: '展开全文' }).first();
  if (await more.count()) { await more.click(); await expect(notes.getByRole('button', { name: '收起' }).first()).toBeVisible(); }
  expect(await notes.locator('blockquote.note').count()).toBeGreaterThan(0);
  await expect(notes.locator('script')).toHaveCount(0);
  await page.getByRole('link', { name: '对话' }).click(); await expect(page.getByTestId('talk')).toBeVisible();
});

test('要点分层：显示层级与发言人，点节号跳到对应对话', async ({ page }) => {
  const c = archive().cases[0];
  const g = c.groups.find((x) => x.cards.some((k) => k.refs?.length))!;
  const card = g.cards.find((k) => k.refs?.length)!;
  const target = card.refs![0]; const n = c.sections.findIndex((s) => s.id === target) + 1;
  await openCase(page, `#/case/${c.id}/notes`);
  if (g.layer) await expect(page.getByTestId('notes').locator(`[data-layer="${g.layer}"] .layer-badge`)).toBeVisible();
  if (card.who) await expect(page.getByTestId('notes').locator('.note-who', { hasText: card.who }).first()).toBeVisible();
  await page.getByTestId('notes').locator(`.note-refs a[href$="/s/${target}"]`).first().click();
  await expect(page.getByTestId('talk')).toBeVisible();
  await expect(page.getByTestId('open-toc')).toContainText(`${n}/${c.sections.length}`);
});

test('全局搜索（公开层）：术语与概念卡命中并可跳转', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '搜索全部' }).click();
  await page.getByTestId('global-search-input').fill('能指');
  await expect(page.getByTestId('global-search-count')).toContainText('处');
  await expect(page.getByTestId('global-search-results').locator('a.hit').first()).toBeVisible();
  const gs = page.getByTestId('global-search');
  await gs.locator('a.hit', { hasText: '术语' }).first().click();
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('#/terms/');
  await expect(page.getByTestId('term-detail')).toBeVisible();
});

test('全局搜索（案例层）：解锁后可搜到对话与要点', async ({ page }) => {
  await openCase(page);
  await page.getByRole('link', { name: '返回学习首页' }).click();
  await page.getByRole('button', { name: '搜索全部' }).click();
  await page.getByTestId('global-search-input').fill('父亲');
  await expect(page.getByTestId('global-search-count')).toContainText('处');
  const results = page.getByTestId('global-search-results');
  await results.locator('a[href*="/case/"]').first().click();
  await expect(page.getByTestId('talk')).toBeVisible();
});

test('节笔记：写入有标记，首页列出并可跳回，删除后消失', async ({ page }) => {
  const c = archive().cases[0]; const first = c.sections[0];
  await openCase(page, `#/case/${c.id}`);
  const btn = page.locator(`[data-section-id="${first.id}"]`).getByRole('button', { name: '写笔记' });
  await btn.click();
  await page.getByTestId('note-text').fill('我的学习笔记：注意口译转述这一层。');
  await page.getByTestId('note-save').click();
  await expect(page.locator(`[data-section-id="${first.id}"] .note-btn.has`)).toBeVisible();
  await page.getByRole('link', { name: '返回学习首页' }).click();
  const myNotes = page.getByTestId('my-notes');
  await expect(myNotes).toContainText('我的学习笔记');
  await myNotes.locator('a').first().click();
  await expect(page.getByTestId('talk')).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toContain(first.id);
  await page.locator(`[data-section-id="${first.id}"]`).getByRole('button', { name: '写笔记' }).click();
  await page.getByRole('button', { name: '删除' }).click();
  await expect(page.locator(`[data-section-id="${first.id}"] .note-btn.has`)).toHaveCount(0);
  await page.getByRole('link', { name: '返回学习首页' }).click();
  await expect(page.getByTestId('my-notes')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('lakang:notes'))).toBe('{}');
});

test('显示设置：主题与字号立即生效，刷新后保留', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '显示设置' }).first().click();
  const settings = page.getByTestId('settings');
  await settings.getByRole('button', { name: '深色' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await settings.getByRole('button', { name: '特大' }).click();
  await expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('145%');
  await page.keyboard.press('Escape');
  await page.reload(); await expect(page.getByTestId('home')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(await page.evaluate(() => document.documentElement.style.fontSize)).toBe('145%');
  await page.getByRole('button', { name: '显示设置' }).first().click();
  await page.getByTestId('settings').getByRole('button', { name: '跟随系统' }).click();
  await page.getByTestId('settings').getByRole('button', { name: '标准' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
});

for (const width of [320, 390]) for (const scale of [1, 1.45]) {
  test(`${width} 宽、字号 x${scale}：各页面无横向溢出，触控目标不小于 40px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.addInitScript((s) => { document.documentElement.style.fontSize = `${16 * s}px`; }, scale);
    await openCase(page);
    for (const hash of ['#/','#/terms','#/terms/T27','#/cards','#/case/case1','#/case/case1/notes','#/case/case2']) {
      await page.goto('/' + hash); await expect(page.locator('main').first()).toBeVisible();
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth; const bad: string[] = [];
        document.querySelectorAll<HTMLElement>('main *').forEach((el) => {
          const b = el.getBoundingClientRect(); if (b.width && b.right > vw + 1) bad.push(`${el.tagName}.${el.className}`);
        });
        const small = [...document.querySelectorAll<HTMLElement>('main button, main a, main input')]
          .filter((e) => e.offsetParent && !e.closest('.note-body, .para, .sources') && !e.closest('.sCard:not(.on)')) // inline text links are content; off-screen deck cards are scaled
          .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 6), b: e.getBoundingClientRect() }))
          .filter(({ b }) => b.height < 40 || b.width < 40).map(({ t, b }) => `${t} ${Math.round(b.width)}x${Math.round(b.height)}`);
        return { scroll: document.documentElement.scrollWidth - vw, bad: bad.slice(0, 3), small };
      });
      expect(r, hash).toEqual({ scroll: 0, bad: [], small: [] });
    }
  });
}
