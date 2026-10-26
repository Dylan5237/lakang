# 原件状态与本地导入

本次远端提交包含可直接开发的正文、来源和交接规范。以下原始字节文件未通过本次 GitHub 连接器直接上传，不能把本文件当成原件本身：

- 用户上传《会议通知 _ 第一届大湾区拉康派精神分析大会.pdf》（11,336,535 字节）。
- 《身体如何言说_大会随身研读手册.html》（348,730 字节）。
- 《大湾区拉康大会_随身研读手册_发布包.zip》（104,111 字节）。
- 发布包内的内容目录、发布与使用说明、来源清单；公共版现有页面参考图。

前三份的 SHA-256 见 `original-assets.json`。完整原件包 `lakang-originals.zip` 作为本轮聊天附件提供，内含全部原件和逐文件摘要。

## 一次导入

用户把原件包交给本地 Codex 后，在仓库根目录执行（Python 3.9+）：

```sh
python scripts/import_originals.py /path/to/lakang-originals.zip
python scripts/import_originals.py /path/to/lakang-originals.zip --apply
```

第一条验证清单、大小、SHA-256、路径和文件冲突；第二条只新增 `references/originals/` 下的文件。不同内容的既有文件不会被覆盖，同内容文件跳过。脚本不自动 git commit/push，不读取私人学习数据。

导入后检查 git status，只提交这批资料和相应状态更新；不要把其他未提交工作夹带进去。将本文件改为已导入并记录提交 SHA，保留真实状态。

没有原件包时，不生成占位 PDF，不编造下载地址，不宣称 HTML 已上传；可用 `content/` 中资料继续核心网站开发。原件缺失不等于正文资料缺失。

`references/originals/` 是资料归档，不应不加选择地整体发布成网站静态目录。原件中可能含会务收款信息，不将其转化为未经授权的报名支付入口。旧私人版本不在此包，也不进入公共网站。
