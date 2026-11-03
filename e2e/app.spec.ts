import { expect, test } from '@playwright/test';
import { KEY, archive, serveArchive, unlock } from './fixture';

test('锁屏：错误密码被拒；正确后进入列表；锁定后需重新输入', async ({ page }) => {
  await serveArchive(page);
  await page.goto('/');
  await page.getByTestId('key').fill('0000'); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('lock-error')).toHaveText('密码不对。');
  await page.getByTestId('key').fill(KEY); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('home').locator('.case-card')).toHaveCount(archive().cases.length);
  await page.reload(); await expect(page.getByTestId('home')).toBeVisible(); // same session: no retyping
  await page.getByRole('button', { name: '锁定' }).click(); await expect(page.getByTestId('lock')).toBeVisible();
  await page.reload(); await expect(page.getByTestId('key')).toHaveValue('');
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('虚构发言');
});

test('服务器无记录时提示不可用', async ({ page }) => {
  await serveArchive(page, null);
  await page.goto('/'); await page.getByTestId('key').fill(KEY); await page.getByRole('button', { name: '进入' }).click();
  await expect(page.getByTestId('lock-error')).toHaveText('记录暂不可用。');
});

test('对话：目录跳转、阅读位置记忆与继续阅读', async ({ page }) => {
  const c = archive().cases[0]; const target = c.sections[3];
  await unlock(page);
  await page.locator(`[data-case-id="${c.id}"]`).getByRole('link', { name: '读对话' }).click();
  await expect(page.getByTestId('talk')).toBeVisible();
  await page.getByTestId('open-toc').click();
  await page.getByTestId('toc').locator('button', { hasText: target.title }).click();
  await expect(page.getByTestId('toc')).toBeHidden();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/case/${c.id}/s/${target.id}`);
  await expect(page.getByTestId('open-toc')).toContainText(`4/${c.sections.length}`);
  await page.getByRole('link', { name: '返回案例列表' }).click();
  const resume = page.locator(`[data-case-id="${c.id}"]`).getByRole('link', { name: '继续 · 第 4 节' });
  await resume.click();
  await expect.poll(() => page.locator(`[data-section-id="${target.id}"] .sec-head`).evaluate((h) => h.getBoundingClientRect().top)).toBeLessThan(260);
});

test('搜索：高亮命中、计数并跳到命中处', async ({ page }) => {
  test.skip(Boolean(process.env.LAKANG_REAL_JSON), '虚构数据专用');
  await unlock(page, '#/case/case1');
  await page.getByRole('button', { name: '搜索' }).click();
  await page.getByTestId('search').fill('父亲');
  await expect(page.getByTestId('search-count')).toHaveText('1/1');
  await expect(page.locator('mark', { hasText: '父亲' })).toBeVisible();
  await expect(page.locator('.turn.current')).toBeInViewport();
  await page.getByTestId('search').fill('不存在的词'); await expect(page.getByTestId('search-count')).toHaveText('无结果');
});

test('要点：人物图例、长卡展开、引语，切回对话', async ({ page }) => {
  await unlock(page, '#/case/case1/notes');
  const notes = page.getByTestId('notes');
  await expect(notes.locator('.legend li')).toHaveCount(archive().cases[0].legend.length);
  const more = notes.getByRole('button', { name: '展开全文' }).first();
  if (await more.count()) { await more.click(); await expect(notes.getByRole('button', { name: '收起' }).first()).toBeVisible(); }
  expect(await notes.locator('blockquote.note').count()).toBeGreaterThan(0);
  await expect(notes.locator('script')).toHaveCount(0);
  await page.getByRole('link', { name: '对话' }).click(); await expect(page.getByTestId('talk')).toBeVisible();
});

for (const width of [320, 390]) for (const scale of [1, 1.45]) {
  test(`${width} 宽、字号 x${scale}：各页面无横向溢出，触控目标不小于 40px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.addInitScript((s) => { document.documentElement.style.fontSize = `${16 * s}px`; }, scale);
    await unlock(page);
    for (const hash of ['#/', '#/case/case1', '#/case/case1/notes', '#/case/case2']) {
      await page.goto('/' + hash); await expect(page.locator('main')).toBeVisible();
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth; const bad: string[] = [];
        document.querySelectorAll<HTMLElement>('main *').forEach((el) => {
          const b = el.getBoundingClientRect(); if (b.width && b.right > vw + 1) bad.push(`${el.tagName}.${el.className}`);
        });
        const small = [...document.querySelectorAll<HTMLElement>('main button, main a, main input')]
          .filter((e) => e.offsetParent && !e.closest('.note-body'))
          .map((e) => e.getBoundingClientRect()).filter((b) => b.height < 40 || b.width < 40).length;
        return { scroll: document.documentElement.scrollWidth - vw, bad: bad.slice(0, 3), small };
      });
      expect(r, hash).toEqual({ scroll: 0, bad: [], small: 0 });
    }
  });
}

test('要点分层：显示层级与发言人，点节号跳到对应对话', async ({ page }) => {
  const c = archive().cases[0];
  const g = c.groups.find((x) => x.cards.some((k) => k.refs?.length))!;
  const card = g.cards.find((k) => k.refs?.length)!;
  const target = card.refs![0]; const n = c.sections.findIndex((s) => s.id === target) + 1;
  await unlock(page, `#/case/${c.id}/notes`);
  if (g.layer) await expect(page.getByTestId('notes').locator(`[data-layer="${g.layer}"] .layer-badge`)).toBeVisible();
  if (card.who) await expect(page.getByTestId('notes').locator('.note-who', { hasText: card.who }).first()).toBeVisible();
  await page.getByTestId('notes').locator(`.note-refs a[href$="/s/${target}"]`).first().click();
  await expect(page.getByTestId('talk')).toBeVisible();
  await expect(page.getByTestId('open-toc')).toContainText(`${n}/${c.sections.length}`);
});
