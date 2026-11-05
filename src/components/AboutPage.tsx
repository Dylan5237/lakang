import { hrefs } from '../lib/router';
import { studyCards, terms, studySources } from '../lib/study';

export function AboutPage() {
  return <main className="page about-page" data-testid="about-page">
    <header className="page-head">
      <a className="btn-link" href={hrefs.home()}>返回学习首页</a>
      <h1>关于本站</h1>
      <p className="muted">拉康随身读 · 拉康精神分析学习卡</p>
    </header>

    <section className="panel"><h2>这里有什么</h2>
      <p>{studyCards.length} 张概念卡、{terms.length} 条术语、8 条阅读路径与一套按记忆曲线排期的闪卡；另有一个需要密码的私人栏目，收录四场临床演示记录（10 月 28—31 日）的整理稿。</p>
      <p>概念卡与术语随站点公开发布，打开即可阅读；临床演示记录只存放在服务器上，经密码校验后读取。</p>
    </section>

    <section className="panel"><h2>怎么用</h2>
      <ul>
        <li>第一次来：从任一阅读路径开始，按顺序读；每条路径都写明“读完能够”。</li>
        <li>随手翻：概念卡上下滑动换卡，收藏、已读与位置都会记住。</li>
        <li>巩固：闪卡从术语和卡片的“问”生成，翻面后评“忘了 / 记得 / 很熟”，到期自动出现。</li>
        <li>查证：每个术语注明出处；每张卡展开后有来源与页码。</li>
      </ul>
    </section>

    <section className="panel"><h2>内容与方法</h2>
      <p>卡片先说明概念是什么、为什么要区分、原文或例子怎样支持；理论归属尽量写清，转述与他人的研究分别署名。</p>
      <p>涉及译本与口译材料时会注明：口译是现场转述，措辞与术语不等于法语原话；英译稿也不是正式校订版。</p>
      <p>本站共登记 {studySources.length} 条来源，可在卡片与术语的“出处”里查到。</p>
      <p>三环图式据 Graham Joncas《Lacan-Mathemes》的 lacan RSI.tex 重绘（MIT 许可，许可全文随站发布）；交叉画法依《R.S.I.》1974-12-10 课。</p>
    </section>

    <section className="panel"><h2>隐私与本地数据</h2>
      <p>学习进度、收藏、闪卡排期与笔记只保存在这台设备的浏览器里，不上传，也没有账号体系。</p>
      <p>临床演示记录不在站点代码与构建产物中；请求需要携带访问密码，校验在服务器端完成。</p>
      <p>请不要在笔记里记录可识别的真实个案信息；笔记导出文件请自行保管。</p>
    </section>

    <section className="panel"><h2>AI 助手</h2>
      <p>“问一问”优先检索本站公开的概念卡、术语与阅读路径来回答；材料不足时，会标明“以下是超出本站材料的延伸”，再补充拉康派的一般理论。它的底稿里还有一组去标识的专家理论讨论要点（只保留理论表述，不含个案事实、姓名、日期或可识别细节）。</p>
      <p>临床演示记录不进入 AI：助手不读取、不检索、也不接收案例数据，案例页面上不显示入口。提问内容会发送给模型服务用于生成回答；本站不保存对话，也不记录提问内容。</p>
      <p>回答由模型生成，可能出错或混淆文本出处；请把它当作阅读线索，重要判断仍以原文、译本与督导讨论为准。AI 入口头像使用 Agent Robot Avatar（MIT，<a href="licenses/agent-robot-avatar-MIT.txt">许可全文</a>）。</p>
    </section>

    <section className="panel"><h2>边界</h2>
      <p>本站是学习材料，不提供诊疗、心理咨询或临床建议，也不能代替正规训练与督导。文中涉及临床材料时，只讨论公开演示中可讨论的部分。</p>
      <p>拉康派内部对许多问题存在分歧；本站呈现的是可核对的文本线索，不把任何一种读法当作全学派共识。</p>
    </section>
  </main>;
}
