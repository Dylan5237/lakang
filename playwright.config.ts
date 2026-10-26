import { defineConfig } from '@playwright/test';

// 使用本机已安装的 Edge(Chromium 内核)；CI 上可用 PW_CHANNEL=chrome 或留空使用 Playwright 自带 Chromium
const channel = process.env.PW_CHANNEL === undefined ? 'msedge' : process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
