# 实施状态

2026-10-26：会前内容已整体重编，等待本轮精确提交的远端CI核验；既有网站与依赖修复保留。未执行生产部署，不宣称真机或真实学习效果验收完成。

## 当前内容

- 70张卡，稳定ID K001—K073（K022—K024此前合并，继续不复用）。
- 18术语、40来源、16书架入口、10讲者；15个日程区块原样保留。
- 新增 `content/reading-order.json`，保持收藏、笔记和深链基于原ID；先基础与场次知识，再历史讲者和会场工具。
- 相邻研究明确署名，不伪装本届讲稿；自创笔记/提问/保密建议独立登记为S38。
- 审读缺陷与本轮修订见 `docs/editorial/2026-10-26-content-revision.md`，上一轮审读保留在 `docs/reviews/2026-10-26-content-audit.md`。
- 旧章节、旧工具稿和12张示例保留为研究归档，不覆盖回当前发布正文。见 `content/README.md`。

## 已独立核实的依赖修复

`aa28a900f128713db84d9019b81c216d71895042` 保持在本轮祖先链中。

- CI Run：40297484283；Job：121486968125。
- 结果：success；`npm ci`为 `found 0 vulnerabilities`。
- Vitest4.1.12，29/29单测；56/56 e2e；typecheck、build通过。
- 这是依赖修复提交的结果；不冒充本轮新内容测试结果。
- 本机镜像audit接口失败与官方源审计成功的区别，见Issue #1评论6412364810。接受已知公告修复，不声明绝对安全。

## 本轮新增验证

`npm run typecheck`、`npm test`、`npm run build`、`npx playwright test`和`python scripts/validate_materials.py`将按新提交由现有CI执行。

内容测试增加：完整稳定ID顺序、核心议题的实质来源与定位、审读纠错回归、原创工具独立归属。来源数量更新至40，术语18；未关闭数据、日程、可访问性或离线检查。

创建本文件时新CI未运行；最终结果必须对应真实提交与日志，并回写Issue。测试检查工程和结构，不等于学术内容或学习效果自动验收。

## 已有工程及记录

站点：React/Vite静态PWA、上下刷、日程互链、搜索筛选、本地收藏/笔记/进度、备份导入导出、字体与主题、离线及缓存更新。无账号、后端或远程AI问答。

原件导入、前几轮提交、历史Edge实测与布局统计保留于[本轮前的实施状态](https://github.com/Dylan5237/lakang/blob/eb781e2d9fab36cc9c25e2d4139c0f9fc48e9324/docs/IMPLEMENTATION_STATUS.md)，不把旧高度统计套用到新正文。

主要历史节点：6795eda原件；31d30d1站点；cf1b00b第二轮内容；bbdcba4三环图；574d0b5措辞修订；436a491旧状态；aa28a90依赖修复；eb781e2内容审读。历史记录中曾遗漏npm告警的总结已由依赖修复和独立验收取代。

## 仍未验证

- iPhone Safari、内置浏览器、真实安卓；桌面Chromium移动视口不等同真机。
- K011真实手机上的交叉缺口与标签视觉效果；用户提供截图，ChatGPT审阅。
- 真实参会者读后的理解与复述效果。
- 实际生产域名上的部署、缓存更新与断网冷启动。

## 运行与构建

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run test:e2e
python scripts/validate_materials.py
```

e2e本地默认Edge；CI使用Playwright Chromium。相对base与hash路由支持子路径，需HTTPS启用Service Worker。静态产物为dist；不应给sw.js配置长期强缓存。本轮未执行部署。
