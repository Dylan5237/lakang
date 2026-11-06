# 项目协作约束

## 交付流程（默认直接上线，再验证）

用户已授权：本项目的改动**默认做完就上线**，不必再问“要不要提交/部署”。每次改动按此顺序走完：

1. 本地验证：`npm run typecheck && npm test && npx playwright test` 全绿（失败就先修，不带伤上线）。
2. 提交并推送 main：按全局提交规范一个闭环一个 commit。
3. 部署：`npm run deploy`；改动涉及 `server/`（AI 服务）时用 `npm run deploy -- --ai`。
4. 上线后验证：用手机尺寸（392×852）打开线上站点走查改动涉及的页面，确认控制台无报错、无失败请求、无横向溢出，并如实汇报；验证不通过就先 `npm run deploy -- --rollback`（前端）再修。

仍需先问用户的情形：改服务器 nginx / systemd / `.env`、`experts.json`，删除线上数据，以及任何会产生真实费用的调用（如在线上发起真实 AI 提问）。

## 部署脚本（`scripts/deploy.mjs`）

- 一律用 `npm run deploy`，不要手工 scp / 手改服务器目录。前端流程：`npm run build` → 打包 dist → 上传到 ssh 别名 `tx`（43.139.159.100）→ 解压到 `lakang.new` 后 mv 替换 `/home/ubuntu/www-share/lakang` → curl 检查返回 200，旧版留在 `lakang.bak`。
- 参数（传参需加 `--`，如 `npm run deploy -- --ai`）：`--skip-build` 复用已有 dist；`--dry-run` 只构建打包不上传；`--rollback` 换回前端上一版；`--ai` 前端之后再部署 AI 服务；`--only-ai` 只部署 AI 服务。环境变量 `LAKANG_DEPLOY_HOST` / `LAKANG_DEPLOY_DIR` / `LAKANG_AI_DIR` / `LAKANG_DEPLOY_URL` 可覆盖默认值。
- AI 服务部署：上传 `server/ai.mjs`、`server/retrieval.mjs`、`server/knowledge/public.json` 到 `/home/ubuntu/lakang-ai/`，备份到 `.bak`，`sudo systemctl restart lakang-ai`，检查 `/health`，失败自动还原。**`experts.json` 与 `.env` 永远不经脚本**（专家要点不进仓库，需手工传，见 README）。
- `dist/private` 存在时脚本会拒绝部署：真实临床记录（`public/private/clinical.json`）构建前必须移走，绝不上传。
- 服务器 nginx 配置不在此脚本范围，见 README「AI 助手」「部署」。
