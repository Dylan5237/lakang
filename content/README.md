# 内容入口与编辑顺序

2026-10-26 内容重编版：70张卡、18术语、40来源、16书架入口；15个日程区块不变。

## 当前发布数据

- `cards/*.json`：当前70张卡的正文、详情、理论归属与关联。稳定ID不随阅读顺序改变。
- `reading-order.json`：默认学习顺序。先基础、分场知识与进阶，再历史讲者和会场工具。每个卡ID恰好出现一次。
- `terms.json`：18个正向释义，与卡片双向连接。
- `sources.json`：来源登记；`editorialScope`为内部编辑范围，不渲染成首屏自证标签。
- `shelf.json`：16个具体阅读入口。
- `agenda.json`：2026-10-16版会议通知的15个区块，本轮未更改。

## 留档资料，不再作为当前发布正文覆盖回去

`chapters-*.md`、`speakers.md`、`toolkit.md`及`card-examples.json`保留早期资料与12张示例的历史状态。它们不是本轮新增知识的完整镜像；出现不同表述时先看当前卡片及对应的编辑记录，不能自动把旧章节重新切片覆盖新卡。

本轮变更依据：`docs/reviews/2026-10-26-content-audit.md`。
修订及材料范围：`docs/editorial/2026-10-26-content-revision.md`。
编者工具与原创例子：`docs/editorial/learning-tools.md`。

## 修改时的约束

每个新主张由确实支持它的文本承担；题名、目录和机构主页只证明其能支持的事项。先给读者知识和例子，必要限定自然写进句子。相邻研究须署名，不归为本届讲者的未公开观点。不得用引用编号代替学术判断，也不得用测试通过代替读者理解验证。

执行 `python scripts/validate_materials.py`、`npm run typecheck`、`npm test`、`npm run build` 和相应 e2e。它们检查数据与行为，不自动证明解释无误。
