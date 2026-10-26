import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '拉康 · 随身读｜专题精读与大会日程',
        short_name: '拉康随身读',
        lang: 'zh-CN', start_url: './', scope: './', display: 'standalone',
        background_color: '#f7f6f2', theme_color: '#f7f6f2',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
