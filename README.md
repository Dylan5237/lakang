# 会前知识卡 · 第一届大湾区拉康派精神分析大会

把会前资料做成适合动车途中连续阅读的知识卡网站：上下刷卡、五天日程、卡片与场次互相跳转、收藏/已读/笔记、阅读位置记忆、离线阅读。纯静态站点，没有后端、账户或社区。

大会：第一届大湾区拉康派精神分析大会，主题《身体如何言说？》，2026 年 10 月 27—31 日，香港中文大学（深圳）。日程一律按 Asia/Shanghai 解释，与设备所在时区无关。

## 运行

需要 Node.js 20 及以上（开发环境为 Node 24）。

```bash
npm ci
npm run dev          # 开发服务器
npm run typecheck    # TypeScript 严格检查
npm test             # 单元测试(内容完整性/日程/存储/搜索/筛选)
npm run build        # 类型检查 + 生产构建到 dist/，同时生成 Service Worker
npm run preview      # 以 127.0.0.1:4173 预览 dist/
npm run test:e2e     # Playwright 端到端(会先 build 并起 preview)
```

`npm run test:e2e` 默认使用本机已安装的 Microsoft Edge。使用 Chrome：`PW_CHANNEL=chrome npm run test:e2e`；使用 Playwright 自带 Chromium：先 `npx playwright install chromium`，再 `PW_CHANNEL= npm run test:e2e`（PowerShell：`$env:PW_CHANNEL=''`）。

资料层面的校验另有 `python scripts/validate_materials.py`（Python 3）。

## 部署

产物是 `dist/` 里的纯静态文件，构建使用相对路径（`base: './'`）且为 hash 路由，因此可放在域名根或任意子路径（如 GitHub Pages 的 `/lakang/`）而无需改配置，也不需要服务器重写规则。

1. `npm ci && npm run build`
2. 把 `dist/` 的全部内容发布到静态托管（GitHub Pages、对象存储、Nginx 目录均可）。
3. 要求 HTTPS（或 localhost），Service Worker 才会注册；`sw.js` 不要设置长期强缓存。

本仓库不含自动生产部署流程；发布由维护者手动执行。

## 离线与更新

首次联网打开并等待顶栏出现“离线已就绪”后，断网仍可阅读全部卡片、日程与指南。新版本部署后，已打开过的用户会在页面顶部看到“有新版本可用”，点“更新”即切换到新版本并重载；不点则继续使用旧版本，不会被强制刷新。

## 本地数据

收藏、已读、笔记、阅读位置和显示设置只保存在浏览器 localStorage 的 `lakang:v1`，不上传。“我的”页可导出 JSON 备份、导入（合并或覆盖，导入前预览，非本站文件会被拒绝）、确认后清除。备份含笔记，请勿公开分享；本站不收集真实个案信息，请勿在笔记里写。

## 目录

- `content/`：结构化内容（`cards/*.json` 70 张卡、`agenda.json`、`speakers.json`、`terms.json`、`shelf.json`、`sources.json`）与章节源文。
- `src/`：React 应用；`src/lib/` 为日程判定、存储、搜索、筛选、路由、PWA 等纯逻辑。
- `tests/`：Vitest 单元测试；`e2e/`：Playwright 测试。
- `references/`：原件与资料档案，**不会**被复制进公开站点；外部出版物不因列入书目而取得再发布许可。
- `docs/`：产品要求、编辑规范、验收标准与 `IMPLEMENTATION_STATUS.md`（实际验证记录）。

## 协作约束

见 `AGENTS.md` 与 `docs/CODEX_HANDOFF.md`。新增事实须核原始来源并更新来源与编辑记录；视觉验收由用户用真实手机截图交 ChatGPT 审阅。
