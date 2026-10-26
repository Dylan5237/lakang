# 原件状态与本地导入

状态：**已导入**（提交 6795eda，2026-10-26）。`lakang-originals.zip`（12,089,110 字节，SHA-256 `f5172e44ae9f8c69d38d018078e24e0002c22fde7f94cbd162bfade580f918a7`）经 `scripts/import_originals.py` 校验后导入 `references/originals/`：15 个文件逐个 SHA-256 一致、0 冲突、未覆盖既有文件。下列三份原始字节文件的摘要已对照 `original-assets.json` 读回确认（工作树与 `git show` 取出的提交内容均一致）：

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
