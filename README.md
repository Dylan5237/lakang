# 拉康 · 随身读

面向参会者与拉康爱好者的移动阅读站：短卡上下刷、分节精读、六组专题路径、五天大会日程、搜索、收藏/笔记/已读、离线缓存。纯静态PWA，没有后端、账号、社区或实时AI诊疗。

100张卡（原70张保留，新增30篇精读），26术语，49条来源记录，6组专题，每组5篇；10位讲者、15个日程区块。来源含独立登记的编者工具，不将数量当作学术质量或学习效果证明。

## 从问题进入

| 专题 | 阅读主线 |
|---|---|
| 为什么满足了，仍然在欲望？ | 需要/要求/欲望、他者、客体小a、幻想、驱力 |
| 我有一个身体 | 镜像、两种理想、Radiophonie精读、言说回响、镜子与纽结 |
| 已经懂了，为什么还会重复？ | 症状、隐喻/转喻、重复与修通、乔伊斯、纽结 |
| 分析中的一句话 | 言说位置、移情、被假定知道、歧义、逻辑时间 |
| 从分析室走出去 | 四种话语、知识、艺术、爱情、分析伦理 |
| 怎样继续读 | 文本节点、语言结构、学派差异、卡特尔、反例 |

进入“专题”可直接选组，不必刷完全部基础卡。首屏保留一个问题和要点，展开后读论证、例子与文本；前后篇、继续未读、基础补课和场次链接相互衔接。教学例子不冒充病例，具名研究不冒充本届讲稿。

大会：第一届大湾区拉康派精神分析大会《身体如何言说？》，2026-10-27—31，香港中文大学（深圳）。日程统一按Asia/Shanghai；10/28上午与10/29下午/晚间换场保留；两场开幕演讲共享09:30—12:00，不虚构各自时间。

## 运行

已验证CI使用Node22；本地采用满足锁定依赖要求的Node版本，不将“任意Node20”当兼容保证。

```bash
npm ci
python scripts/validate_materials.py
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
npm run test:e2e
```

`npm run build`先重建靛蓝PNG图标，再进行类型检查、Vite生产构建和Service Worker生成。不要跳过prebuild后只复制旧public图标。

e2e本地默认已安装的Microsoft Edge；使用Playwright Chromium时，先`npx playwright install chromium`，再`PW_CHANNEL= npm run test:e2e`。PowerShell先`$env:PW_CHANNEL=''`。最新真实测试记录见`docs/IMPLEMENTATION_STATUS.md`，不将文档中的历史结果套用于未验新提交。

## 部署与离线

构建产物为`dist/`全部文件，`base:'./'`和hash路由支持`/lakang/`子路径，不要求路由重写。源码、references和个人备份不要复制到公开目录。

用户已报告旧版部署于`http://43.139.159.100/lakang/`。仓库提交不等于服务器发布；本次内容/主题更新没有登录服务器、配置证书或上传新dist。

公网HTTP不能作为本站生产离线能力已验的依据。需要有效HTTPS和浏览器允许缓存，首次联网显示“离线已就绪”后再实测关闭浏览器、断网重开。外部原文链接仍需联网，站内专题正文已内嵌可缓存。sw.js与index.html不要长期不可更新的强缓存；更新需用户确认后重载。

详细步骤、证书要求与验收清单见`docs/deployment/HTTPS_CHECKLIST.md`。

## 本地数据

收藏、已读、笔记、阅读位置和显示设置仍使用localStorage键`lakang:v1`。原70卡ID保留；新专题进度复用已读记录，无云端同步。

**HTTP切HTTPS或更换域名，会进入另一份浏览器本地数据。先从旧地址“我的→导出备份”，再到新地址导入。** 不要在未备份前直接使旧入口永久不可达。备份包含笔记，请勿公开；本站不收集真实个案资料。

## 目录与协作

- `content/cards/`：12组现行卡片；`series.json`专题路径，`reading-order.json`默认顺序。
- `content/sources.json`及`sources-extension.json`：来源；`terms.json`及`terms-extension.json`：术语与显式反链。
- `src/`：React应用；`src/indigo.css`为靛蓝/纸白/墨黑及暗色主题。
- `tests/`、`e2e/`：结构、逻辑、导航、小屏、主题对比度与离线回归。
- `references/`：原件与历史资料，不因归档而获得再发布授权。
- `docs/editorial/2026-10-26-enthusiast-series.md`：本轮内容、文本使用范围与设计记录。

见`AGENTS.md`、`docs/CODEX_HANDOFF.md`。不强推、不覆写他人工作树；学术准确、真实学习效果、实机体验与程序测试分别说明。靛蓝是本站视觉选择，不宣称拉康派有统一官方色。
