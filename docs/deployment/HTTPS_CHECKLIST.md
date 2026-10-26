# 发布与HTTPS检查

用户现有地址：`http://43.139.159.100/lakang/`。本轮更新代码和内容，不代表已修改该服务器。

## 重新构建

在确认本地工作树后，正常同步main（不强推、不覆盖未提交工作），运行：

```sh
npm ci
python scripts/validate_materials.py
npm run typecheck
npm test
npm run build
```

prebuild会重建靛蓝PNG图标。发布dist全部文件到原静态目录，保留/lakang/路径；不要发布references、个人备份或源码目录代替dist。先保留上一版本供回滚。

## HTTPS是服务器工作，不是前端改色能完成

配置浏览器信任、覆盖实际访问主机名或IP的有效证书。核实最终访问的协议、证书、静态路径与全部资源，不凭页面能打开就宣称离线可用。不要将localhost测试等同公网HTTP。

Service Worker需要安全上下文；公网HTTP通常不能注册。依据：https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API 。

同一主机的HTTP与HTTPS也是不同localStorage来源。切换之前在原地址“我的→导出备份”，切换之后再导入；不要在未备份前直接使旧入口永久不可达。依据：https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage 。

## 公网验收顺序

1. 新地址首次完整加载，检查100卡、六专题、26术语、15日程区块；确认主题浅深切换与长文前后篇。
2. HTTPS下确认“离线已就绪”；关闭浏览器，断网后重新打开同一地址，检查K074/K093长文、专题目录、日程、笔记。
3. 重新联网，部署新版本后验证更新提示和刷新；sw.js/index.html不配置长期不可更新的强缓存，带内容hash资源可长期缓存。
4. 分别记录iPhone Safari、内置浏览器、真实安卓的结果。程序化Chromium移动视口不能替代这些实机。
5. 当前会务以主办方更新为准；代码保留已有15区块，未接入会务群。

不要把失败的注册吞成‘稍等就好’，也不要通过关闭安全机制来声称生产离线能力已通过。
