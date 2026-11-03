import { expect, test } from '@playwright/test';

// The real record lives only on the server behind an nginx header check; here the route is mocked.
const RECORD = '<!doctype html><meta charset="utf-8"><h1>测试记录</h1><script>document.body.dataset.ok="1"</script>';
test.beforeEach(async ({ page }) => {
  await page.route('**/private/clinical.html', (route) => route.request().headers()['x-lakang-key'] === 'test-key'
    ? route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: RECORD })
    : route.fulfill({ status: 403, body: 'forbidden' }));
});

test('临床：密码错误被拒，正确后在隔离框中显示，锁定后需重新输入', async ({ page }) => {
  await page.goto('/#/clinical');
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '临床' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('clinical-frame')).toHaveCount(0);
  await page.getByTestId('clinical-key').fill('1234'); await page.getByRole('button', { name: '查看' }).click();
  await expect(page.getByTestId('clinical-error')).toHaveText('密码不对。');
  await page.getByTestId('clinical-key').fill('test-key'); await page.getByRole('button', { name: '查看' }).click();
  const frame = page.getByTestId('clinical-frame');
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(page.frameLocator('[data-testid="clinical-frame"]').getByRole('heading', { name: '测试记录' })).toBeVisible();
  await page.reload(); await expect(page.getByTestId('clinical-key')).toHaveValue('test-key');
  await page.getByRole('button', { name: '查看' }).click(); await page.getByRole('button', { name: '锁定' }).click();
  await expect(page.getByTestId('clinical-key')).toHaveValue(''); await expect(page.getByTestId('clinical-frame')).toHaveCount(0);
  // The record must not leak into the shipped bundle or local backup storage.
  expect(await page.evaluate(() => localStorage.getItem('lakang:v1') ?? '')).not.toContain('测试记录');
});

test('临床：服务器无记录时提示不可用', async ({ page }) => {
  await page.unroute('**/private/clinical.html'); await page.route('**/private/clinical.html', (route) => route.fulfill({ status: 404, body: 'not found' }));
  await page.goto('/#/clinical'); await page.getByTestId('clinical-key').fill('test-key'); await page.getByRole('button', { name: '查看' }).click();
  await expect(page.getByTestId('clinical-error')).toHaveText('记录暂不可用。');
});
