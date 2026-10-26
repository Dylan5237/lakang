# 发布内容与研究归档

当前发布内容：`cards/*.json`（100卡）、`terms.json` + `terms-extension.json`（26术语）、`sources.json`的sources + `sources-extension.json`（49来源）、`series.json`（6组，每组5篇）、`reading-order.json`（完整稳定ID顺序）、`agenda.json`（15区块）、`speakers.json`与`shelf.json`。

`src/data.ts`显式合并；扩展术语中的cardIds提供双向关联，不通过关键词猜测。专题导航与原卡片共用同一ID、笔记和收藏。

- K001—K073旧ID全部保留；K022—K024此前合并，不复用。
- K074—K103是本次30篇分节精读，不是旧卡拆分计数。
- 每篇detail使用`### `开头行作为小标题，其余仍为安全文本；不嵌入任意HTML。
- 前台不堆来源真实性等级；原作者归属、出处和定位保留。
- 来源中S38是编者工具，不假称外部论文；其他来源各记真实使用范围。
- 新增来源不等于读过全部全文。没有取得的文本不代作者总结；新讲稿未公布不预告。

旧`chapters-*.md`、`toolkit.md`、`speakers.md`与`card-examples.json`保留为研究/交接归档，不用它们自动覆盖现行卡片。这些档案与现行数据的区别不应被删除。

校验：`python scripts/validate_materials.py`、`npm test`。它们检验ID、链接、顺序与字段，不检验所有学术解释或真实学习效果。

本轮详见`docs/editorial/2026-10-26-enthusiast-series.md`；部署与HTTP到HTTPS的笔记迁移见`docs/deployment/HTTPS_CHECKLIST.md`。
