# 项目协作约束

## 部署

- 前端上线一律用 `npm run deploy`（`scripts/deploy.mjs`），不要手工 scp / 手改服务器目录。流程：`npm run build` → 打包 dist → 上传到 ssh 别名 `tx`（43.139.159.100）→ 解压到 `lakang.new` 后 mv 替换 `/home/ubuntu/www-share/lakang` → curl 检查返回 200。
- 参数：`--skip-build` 复用已有 dist；`--dry-run` 只构建打包不上传；`--rollback` 换回同级 `lakang.bak`（上一版）。环境变量 `LAKANG_DEPLOY_HOST` / `LAKANG_DEPLOY_DIR` / `LAKANG_DEPLOY_URL` 可覆盖默认值。传参需加 `--`，如 `npm run deploy -- --rollback`。
- 部署前先 `npm run typecheck && npm test && npx playwright test` 全绿，且已合并推送到 main。部署会直接改线上，用户没说“部署/上线”不要执行。
- `dist/private` 存在时脚本会拒绝部署：真实临床记录（`public/private/clinical.json`）构建前必须移走，绝不上传。
- AI 服务（`server/`）与服务器 nginx 配置不在此脚本范围，见 README「AI 助手」「部署」。
