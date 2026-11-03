import { defineConfig } from '@playwright/test';

// 本机用已安装的 Edge；CI 上 PW_CHANNEL='' 用 Playwright 自带 Chromium。
// LAKANG_REAL_JSON=<本地私人 JSON> 可让同一套用例跑真实记录（文件不进仓库）。
const channel = process.env.PW_CHANNEL === undefined ? 'msedge' : process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:4173', channel, locale: 'zh-CN', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 180_000,
  },
});
