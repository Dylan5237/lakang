# 项目接手入口

当前为100张主卡+18张附录、四篇官方前瞻正文、六组精读专题。先读docs/IMPLEMENTATION_STATUS.md和PR #3最新实际结果，再核对远端main与本地工作树。

## 本轮内容已完成，不重新生成

官方前瞻仅据用户提供的wx-pdf-20261026.zip，正文在content/official/P01—P04.json；18张提炼卡在content/cards/13-official.json。正文与独立原文hash对应。保持“摄入”、原文问句和公开病例时间，不用通用知识补成讲者未说过的结论。

主卡顺序以content/reading-order.json为准；content/retired-card-ids.json的18卡在附录。src/data.ts的cards是100张主卡，allCards是118条可访问资料；cardById与用户数据knownIDs包括附录。不得复用旧ID承载新文章，不得清洗旧收藏、笔记或备份。

## 发布与原始PDF

本轮代码没有操作生产服务器。已有HTTP地址是否已被更新，必须实际核实。

原文正文文字版已经可用；四个带图片版式的PDF尚未入库。拿到同一个用户ZIP后：

```sh
python scripts/import_official_originals.py /path/to/wx-pdf-20261026.zip
python scripts/import_official_originals.py /path/to/wx-pdf-20261026.zip --apply
python scripts/validate_materials.py
npm run typecheck
npm test
npm run build
```

确认public/originals/P01—P04.pdf及pdf-registry.json变更，按用户要求提交。构建后部署dist，保留现网备份；不得操作无关站点。导入前按钮不出现，不得先填不存在的PDF地址。PDF文件不纳入当前离线预缓存，文字原文可离线。

原文入口：#/previews；原文段落示例：#/previews/P03/original/P03-03；附录：#/previews/appendix。验收100主卡、四文章／18卡、原文返回、旧卡笔记／收藏、15日程、六专题与新主题。

需HTTPS才能准备公网离线；换协议或域名前从旧地址导出本机笔记，再到新地址导入。详见docs/deployment/HTTPS_CHECKLIST.md。不得因localhost测试通过声称公网HTTP离线可用。

## 保持纪律

不覆盖工作树，不强推，不回退依赖修复。工程与内容来源检查分开，不以测试数量替代学习效果。真实手机截图由用户提供、ChatGPT审阅，本地Agent只负责实现、测试、日志与部署核对。实际回报提交SHA、部署SHA、访问地址、测试与尚未验证的项目。
