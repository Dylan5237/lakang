# 当前内容与历史资料

## 当前发布数据

- cards/*.json：118个可访问的稳定ID；不是118张主流卡。
- reading-order.json：100张主卡的顺序，含K104—K121共18张官方前瞻卡。
- retired-card-ids.json：18张移入附录的原卡。原内容不删除，ID不复用，旧笔记／收藏不清洗。
- official/P01—P04.json：四篇用户提供官方前瞻的正文文字、段落ID、署名、讲者、日期、PDF页码与文件hash。
- official/text-digests.json：从所给PDF正文独立提取的去空白SHA。改动文字需对照原件，不自动重算来使测试通过。
- official/pdf-registry.json：仅登记已存在且校验相符的public/originals/Pxx.pdf。当前为空；正文可读不等于PDF已上传。
- sources.json、sources-extension.json：S01—S49。S50—S53从四篇official元数据在src/data.ts生成，前台打开站内原文。
- terms.json、terms-extension.json：26项背景术语；与官方原文区别显示。
- series.json：六组共30篇精读（K074—K103）及基础卡／场次连接，本轮完整保留。
- agenda.json：15个日程区块，不从前瞻文章擅自改会务安排。

src/data.ts的cards为100张主卡，allCards及cardById覆盖118条，retiredCards为18张附录。读取进度只计当前主卡；原卡深链和备份仍可解析。

## 研究归档

chapters-*.md、speakers.md、toolkit.md、card-examples.json等早期长手册与示例保留为历史资料，不自动覆盖当前JSON。历史文档的数量／版本说明由docs/IMPLEMENTATION_STATUS.md及最新提交记录解释。

## 编辑与原件

官方卡只提炼其所属文章，不以通用知识补写原文未给出的结论。原文的问句、理论归属与病例时间保留。卡片中的背景术语、原文转录与编辑导读是不同层次。

原PDF导入：python scripts/import_official_originals.py /path/to/wx-pdf-20261026.zip --apply。先按SHA核对再复制，不覆盖不同内容。完整替换理由见docs/editorial/2026-10-26-official-previews.md。
