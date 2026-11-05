# 拉康随身读

拉康随身读：公开学习层（概念卡 67 张、8 条阅读路径、术语词典 32 条，随站点发布）＋ 私人临床演示记录（服务器端密码保护）＋ 站内学习助手“问一问”。

- 学习层：8 条阅读路径（覆盖全部卡片，带“读完能够”与进度）、概念卡上下滑动换卡（scroll-snap 卡组、进度/收藏/目录/正文互链、所属路径、RSI 三环图）、闪卡复习（术语与问题卡，翻面评分，Leitner 式间隔排期，进度仅存本机）、术语词典（并入“我的”，可展开检索；定义、展开、案例回链、相关术语与出处）、我的学习（统计、路径进度、收藏、词典、临床笔记导出）、全局搜索覆盖术语/概念卡/案例、关于页（方法、隐私与边界）。
- AI 助手：底栏第 4 位的“AI”页签（静态线性机器人图标，替代原词典位置），对话为独立页面；默认用 minimal 快速回答；对话页可开“深度思考”，此时先流式显示思考过程，正文开始后折叠为“思考过程 · Ns”；离开页面后后台继续生成，页签依次显示思考中 / 回答中 / 已回答。服务端先检索站内公开知识，再把命中材料与去标识的专家理论要点交给火山方舟模型生成回答，SSE 流式返回；案例页不显示入口，服务端也没有任何读取临床记录的代码路径。
- 案例层：紧凑标题栏（目录并入标题栏）、对话气泡、目录跳转、要点卡、节笔记（仅本机）、阅读位置记忆；案例内搜索已移除，跨内容搜索见首页。
- 通用：主题与字号设置、深色模式、移动端优先。

2026 年会议版（知识卡、日程、讲者、官方前瞻等）已下线，完整保留在标签 `archive/conference-2026`。

## 隐私设计

记录是真实临床材料，本仓库是公开的，因此：

- 记录（源 HTML 与生成的 JSON）**不进仓库、不打包进站点**，`.gitignore` 已排除。
- 公开图式据 Lacan-Mathemes（MIT）重绘，许可全文在 `public/licenses/lacan-mathemes-MIT.txt`。
- 站点运行时请求 `private/clinical.json`，请求头 `X-Lakang-Key` 携带访问密码；**校验在服务器 nginx 完成**，不符返回 403，仅限 HTTPS。仓库与构建产物中都没有密码。
- 记录只在内存中，不写入离线缓存或本地存储；本地只保存各案例读到的节编号。密码默认只存当次会话，可选“在这台设备上记住”，“锁定”会清除。

## 开发

```bash
npm ci
npm run dev
npm test               # 单测（含转换脚本，需 python）
npx playwright test    # e2e，用虚构数据模拟服务器
LAKANG_REAL_JSON=/path/clinical-cases.json npx playwright test   # 本机用真实记录跑同一套检查
npm run build
```

本地预览真实记录：把 JSON 放到 `public/private/clinical.json`（已被 git 忽略）。**构建前移走**，否则会被复制进 `dist/`。

## 更新记录

```bash
python scripts/build_clinical.py <记录.html> <输出.json>
```

然后把输出上传到服务器 `/home/ubuntu/private-lakang/clinical.json`。

## AI 助手（问一问）

浏览器 → 同源 `/lakang/api/chat` → Node 服务（`server/ai.mjs`）→ 火山方舟（OpenAI 兼容 SSE）。

- `scripts/build_ai_knowledge.mjs` 只读取 `content/cards.json`、`terms.json`、`paths.json`，生成 `server/knowledge/public.json`（107 段）。它不读取任何临床文件。
- `server/knowledge/experts.json` 是去标识的专家理论讨论要点（E01–E20），**不进仓库**（`.gitignore`），部署时从本机私人目录单独上传，权限 600。
- `server/ai.mjs` 在启动时加载这两份知识；检索命中站内材料与相关专家要点后，连同问题发给模型。服务端没有读取 `clinical.json` 的代码，案例数据也不会进入提示词。
- 需要的环境变量：`ARK_API_KEY`（必填，仅存服务器 `/home/ubuntu/lakang-ai/.env`，0600）、`ARK_URL`、`ARK_MODEL`（默认 `doubao-seed-2.1-lite`）、`ALLOW_ORIGIN`、`PORT`（默认 8787）、`ARK_REASONING_EFFORT`（深度思考时的 effort，默认 low）。密钥不进仓库、不进构建产物、不写日志。
- 内置限流：每 IP 每分钟 20 次、全局每分钟 80 次；请求体上限 100 KB，消息最多 12 条、合计 12000 字。
- 请求体 `deep: false` 走 `reasoning_effort: minimal`（快速），`deep: true` 走 `low`（展示思考）。
- 本地联调：`node scripts/build_ai_knowledge.mjs`，把 `experts.json` 放到 `server/knowledge/`，然后 `ARK_API_KEY=... node server/ai.mjs`，`npm run dev` 会把 `/api` 代理到 8787。

## 部署

前端：`npm ci && npm run build`，用 `dist/` 替换服务器上 `/home/ubuntu/www-share/lakang/` 对应目录。`public/sw.js` 用于注销会议版遗留的 Service Worker，需保持 `Cache-Control: no-cache`。服务器端 nginx 配置不在仓库内。

AI 服务（服务器已装 Node 22）：

```bash
# 目录 /home/ubuntu/lakang-ai：ai.mjs、retrieval.mjs、knowledge/{public,experts}.json、.env(600)
# systemd: lakang-ai.service -> node /home/ubuntu/lakang-ai/ai.mjs, EnvironmentFile=.env
# nginx 仅 HTTPS server 块：
location = /lakang/api/chat {
    proxy_pass http://127.0.0.1:8787/api/chat;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 120s;
    client_max_body_size 100k;
}
```

部署后 `curl https://43.139.159.100/lakang/api/chat`（健康检查走 `GET /health`，仅本机）与页面内提问各验一次；若更换为标准 Ark Key，把 `ARK_URL` 改回 `https://ark.cn-beijing.volces.com/api/v3/chat/completions`。
