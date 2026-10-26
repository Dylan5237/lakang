# 实施状态

2026-10-26：会前内容重编已提交，精确代码提交 `3e4d1d88740b958867b9fd1e9336b1329dd106cc` 已通过远端CI。未执行生产部署；真机视觉/离线与真实读者理解效果仍未验。

## 当前内容

- 70张卡，稳定ID K001—K073（K022—K024此前合并，继续不复用）；六组正文及详情已重编。
- 18术语、40来源、16书架入口、10讲者；15个日程区块原样保留。
- `content/reading-order.json`先组织基础与场次知识，再历史讲者和会场工具；收藏、笔记和深链继续使用原ID。
- 补齐驱力、并入、物、书写、节奏、青少年与移情的实质知识。主体/自我、大他者、客体小a等增加入门说明与关联。
- 相邻研究明确署名，不伪装本届讲稿；编者工具独立登记为S38。
- 详见 `docs/editorial/2026-10-26-content-revision.md`；上一轮审读保留于 `docs/reviews/2026-10-26-content-audit.md`。
- 旧章节、工具稿和12张示例是研究归档，不覆盖当前发布正文；见 `content/README.md`。

## 本轮实际验证

代码/内容SHA：`3e4d1d88740b958867b9fd1e9336b1329dd106cc`。

[CI 40303313046](https://github.com/Dylan5237/lakang/actions/runs/40303313046)，job `121506204623`，completed/success，已读取完整日志。环境Ubuntu24.04、Node22.23.3、npm10.9.9、Vitest4.1.12、Playwright自带Chromium。

| 检查 | 实际结果 |
|---|---|
| npm ci | found 0 vulnerabilities |
| npm run typecheck | 通过 |
| npm test | 5文件、32/32通过；含12项内容测试 |
| npx playwright test | 56/56通过，33.5秒 |
| npm run build | 成功；PWA预缓存16项、414.81 KiB |

资料层在内容提交 `43e12c227d08d05e8eb9303a1da76ab8231ae23b` 上运行：[Validate 40302974092](https://github.com/Dylan5237/lakang/actions/runs/40302974092)，job `121505085095`，success。实际输出：

```text
PASS: 16 chapters, 10 speakers, 40 sources, 15 agenda blocks, 12 example cards, 70 current cards, 18 terms; reading order complete
```

其后3e4d1d8只更新两份测试与交接文档，未更改该校验所检查的数据和脚本。最终代码CI的内容测试再次校验全部ID、引用、日程、18术语、40来源及顺序。

首轮CI `40302974117` 曾因两处旧测试假设失败：按类别连续排序、糖肽必出现在某张旧标题。已在3e4d1d8改为显式完整路径与筛选后相对顺序；搜索继续验证标题优先、正文命中、多词与关系及限定集合。没有删除失败测试、关闭审计或取消离线/布局检查。

程序测试覆盖刷卡、返回/焦点、搜索筛选、收藏笔记、导入导出、三时区日程、小屏/横屏/大字号、图示边界和许可、离线冷启动及缓存更新。它们证明结构与行为，不自动证明所有学术解释或所有读者的理解。

## 依赖修复独立验收

`aa28a900f128713db84d9019b81c216d71895042`保留在祖先链中，包与锁文件本轮没有修改。

- CI `40297484283`，job `121486968125`：success；npm ci零已知告警；29/29单测、56/56 e2e及build通过。
- Vitest3→4为主版本升级，并非补丁版本；本项目已有回归结果支持兼容。本轮再跑仍零已知告警。
- 本机npmmirror不支持audit接口，不把接口失败当通过；官方源审计详情见Issue #1评论6412364810。
- 接受已知公告修复，不将其升级为供应链绝对安全保证。

## 提交与历史

| SHA | 本轮成果 |
|---|---|
| 43e12c2 | 70卡内容重编、40来源、18术语、16书架、学习顺序与回归校验 |
| 3e4d1d8 | 更新旧顺序/标题测试假设、保留搜索与筛选约束，全部CI通过 |

原件导入、历史提交与旧Edge布局统计见[重编前状态](https://github.com/Dylan5237/lakang/blob/eb781e2d9fab36cc9c25e2d4139c0f9fc48e9324/docs/IMPLEMENTATION_STATUS.md)，不将旧高度统计套到新正文。历史遗漏的npm告警总结已由依赖修复与独立验收取代。

本次Git比较确认 `agenda.json`、`package.json`、`package-lock.json`和存储键逻辑未修改；无强推，无生产部署。

## 仍未验证

- iPhone Safari、内置浏览器与真实安卓；桌面Chromium移动视口不等同真机。
- K011真实手机上的交叉缺口与标签视觉效果；用户提供截图，ChatGPT审阅。
- 真实参会者读后的理解、复述与会前学习效果。
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

e2e本地默认Edge、CI使用Playwright Chromium。相对base与hash路由支持子路径；需HTTPS启用Service Worker，产物为dist，sw.js不应长期强缓存。本状态文件是验证回写，所记录测试精确对应上述代码SHA，不把后续仅文档提交宣称为已重新运行的代码测试。
