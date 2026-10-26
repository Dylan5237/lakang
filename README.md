# 拉康 · 随身读

移动优先的会前知识卡与拉康理论精读：上下刷、官方前瞻原文、六组专题、五天日程、收藏／已读／笔记、阅读位置和离线阅读。纯静态PWA，无账号、后台或病例上传。

## 当前内容

- 100张主卡：82张原有知识卡与18张官方前瞻提炼卡。
- 18张重复方法／会务卡移入附录；旧ID、收藏、笔记与备份不丢失。所有可访问资料合计118条，不与主卡数量混淆。
- 四篇官方文章：《血肉之躯》《精神分析与歧义》《摄入如何影响身体？》《儿童抑郁症的客体》。独立“前瞻”菜单、文章续读与段落级原文跳转。
- 六组专题30篇精读保持：欲望、身体、症状、分析过程、艺术与社会、阅读地图。
- 26术语、53来源记录、10讲者、15日程区块。大会为2026年10月27—31日，日程固定Asia/Shanghai。

## 运行与测试

使用Node22（远端CI实际使用22.23.3）及Python3。原有依赖锁不变。

```sh
npm ci
npm run dev
python scripts/validate_materials.py
npm run typecheck
npm test
npm run build
npm run preview
npm run test:e2e
```

Playwright本地默认Edge；使用自带Chromium时先安装浏览器，设置PW_CHANNEL为空。CI已经这样运行。npm run build包含靛蓝图标生成，产物在dist。

## 原文与原始PDF

四篇正文文字版已内置，保留文章署名与讲者区别、原用语及论证顺序。图片、封面与公众号版式不在文字版内。来源正文及hash在content/official/；每张提炼卡记录原文段落与PDF页码。

原始PDF目前未注册。用户提供的wx-pdf-20261026.zip可由维护者一次导入：

```sh
python scripts/import_official_originals.py /path/to/wx-pdf-20261026.zip --apply
python scripts/validate_materials.py
npm run build
```

工具校验精确文件名及SHA，再写入public/originals并启用PDF查看／保存按钮；不覆盖不同文件。无--apply为只读预览。原PDF不纳入预缓存，文字原文可离线。

## 部署与本机数据

只发布dist全部内容；relative base与hash路由支持/lakang/子路径。生产部署由维护者执行，合并代码不等于上线。Service Worker需要HTTPS或localhost，sw.js不要强缓存；公网HTTP会说明离线不可用。

收藏、已读、笔记、位置、字号与主题保存在lakang:v1，不上传。我的页支持备份导入导出，附录ID仍有效。换域名或HTTP→HTTPS前在旧地址导出，再去新地址导入。笔记仅记录自己的学习，不录入可识别个案。

## 资料与协作

- content/cards/*.json为原有／新卡正文；reading-order.json与retired-card-ids.json划分主卡和附录。
- content/official/为四篇官方前瞻正文、来源元数据和PDF注册；正文对照不依赖外网。
- references/为研究档案，不整体发布；各文献版权分别处理。
- docs/editorial/2026-10-26-official-previews.md记载18张替换理由、原文范围与编辑处理。
- docs/IMPLEMENTATION_STATUS.md、docs/CODEX_HANDOFF.md记载真实提交、验证及发布边界。

本站不是官方会务渠道或诊疗服务；会务变化以主办方通知为准。深靛蓝是本站视觉选择，并非学派官方颜色。
