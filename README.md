# 拉康随身读 · 临床演示

拉康随身读：公开学习层（概念卡 67 张、8 条阅读路径、术语词典 32 条，随站点发布）＋ 私人临床演示记录（服务器端密码保护）。

- 学习层：8 条阅读路径（覆盖全部卡片，带“读完能够”与进度）、概念卡上下滑动换卡（scroll-snap 卡组、进度/收藏/目录/正文互链、所属路径、RSI 三环图）、闪卡复习（术语与问题卡，翻面评分，Leitner 式间隔排期，进度仅存本机）、术语词典（定义、展开、案例回链、相关术语与出处）、我的学习（统计、路径进度、收藏、临床笔记导出）、全局搜索覆盖术语/概念卡/案例、关于页（方法、隐私与边界）。
- 案例层：对话气泡、目录跳转、案例内搜索与高亮、分层要点卡（原话摘要/现场判断/编者延伸/概念背景）、节笔记（仅本机）、阅读位置记忆。
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

## 部署

`npm ci && npm run build`，用 `dist/` 替换服务器上 `/lakang/` 对应目录。`public/sw.js` 用于注销会议版遗留的 Service Worker，需保持 `Cache-Control: no-cache`。服务器端 nginx 配置不在仓库内。
