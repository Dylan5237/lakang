import { useEffect, useRef } from 'react';
import { cardById, officialArticleById, officialArticles, officialPdfs, retiredCards, sessionById } from '../data';
import { hrefs } from '../lib/router';
import { useUser } from '../lib/store';
import type { OfficialArticle } from '../types';

function ArticleMeta({ article }: { article: OfficialArticle }) {
  return <div className="article-meta"><p>{article.publisher} · {article.publishedAt}</p><p>前瞻署名：{article.byline} · 相关讲者：{article.speaker}</p></div>;
}
function Sessions({ article }: { article: OfficialArticle }) {
  return <div className="article-sessions">{article.sessionIds.map((id) => {
    const s = sessionById.get(id); return s && <a key={id} className="btn-link" href={hrefs.agenda(String(s.day), s.id)}>{s.date.slice(5).replace('-', '/')} {s.start} · {s.title}</a>;
  })}</div>;
}
export function PreviewsPage({ articleId, original, paragraphId }: { articleId?: string; original?: boolean; paragraphId?: string }) {
  const user = useUser(); const page = useRef<HTMLElement>(null);
  const article = articleId ? officialArticleById.get(articleId) : undefined;
  const validParagraph = article?.paragraphs.find((p) => p.id === paragraphId);
  useEffect(() => {
    page.current?.scrollTo({ top: 0, behavior: 'instant' });
    if (!original || !validParagraph) return;
    const token = requestAnimationFrame(() => document.getElementById(`source-${validParagraph.id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(token);
  }, [articleId, original, validParagraph?.id]);

  if (articleId === 'appendix') return <main ref={page} className="page previews" data-testid="appendix">
    <header className="page-head"><a className="btn-link" href={hrefs.previews()}>返回官方前瞻</a><h1>附录与会场工具</h1><p className="muted">这18张已退出主卡流；原文、旧链接、收藏和笔记仍保留。</p></header>
    <ul className="entries">{retiredCards.map((c) => <li key={c.id} className="entry"><h2><a href={hrefs.detail(c.id)}>{c.title}</a></h2><p>{c.takeaway}</p><p className="muted">{c.id}{user.favorites.includes(c.id) ? ' · 已收藏' : ''}{user.notes[c.id] ? ' · 有笔记' : ''}</p></li>)}</ul>
  </main>;
  if (articleId && !article) return <main className="page" data-testid="previews"><h1>未找到这篇前瞻</h1><a className="btn-link" href={hrefs.previews()}>返回前瞻目录</a></main>;
  if (!article) return <main ref={page} className="page previews" data-testid="previews">
    <header className="page-head"><span className="eyebrow">大会官方文章精选</span><h1>官方前瞻</h1><p className="muted">四篇文章，十八张提炼卡。先读卡，也能随时回到原文。</p></header>
    <ul className="entries" data-testid="official-articles">{officialArticles.map((a) => {
      const read = a.cardIds.filter((id) => user.read.includes(id)).length;
      const next = a.cardIds.find((id) => !user.read.includes(id)) ?? a.cardIds[0];
      return <li key={a.id} className="entry official-entry" data-article-id={a.id}>
        <span className="eyebrow">前瞻 {String(a.order).padStart(2, '0')}</span><h2><a href={hrefs.previews(a.id)}>{a.title}</a></h2><p>{a.summary}</p><ArticleMeta article={a} />
        <p className="muted">{a.cardIds.length} 张卡 · 已读 {read}/{a.cardIds.length}</p>
        <div className="btn-row"><a className="btn-link" href={hrefs.detail(next)}>{read > 0 && read < a.cardIds.length ? '继续读卡' : '开始读卡'}</a><a className="btn-link" href={hrefs.previews(a.id)}>卡片目录</a><a className="btn-link" href={hrefs.original(a.id)}>查看原文</a></div>
      </li>;
    })}</ul>
    <p className="hint">卡片是本站对文章的提炼；原文页保留官方刊载正文。</p>
    <a className="btn-link" href={hrefs.previews('appendix')}>附录与会场工具（18）</a>
  </main>;
  const pdf = officialPdfs[article.id];
  if (original) return <main ref={page} className="page previews original-page" data-testid="official-original">
    <header className="page-head"><a className="btn-link" href={hrefs.previews(article.id)}>返回文章与卡片</a><span className="eyebrow">原文 · 文字版</span><h1>{article.fullTitle}</h1><ArticleMeta article={article} />
      <p className="hint">按所提供PDF转录正文，保留原文用语；图片与公众号版式不在此文字版内。</p>
      {pdf && <a className="btn-link" data-testid="official-pdf" href={pdf} target="_blank" rel="noopener noreferrer">查看原始PDF（{article.pageCount}页）</a>}
    </header>
    <article className="original-text">{article.paragraphs.map((p) => <section key={p.id} id={`source-${p.id}`} data-paragraph-id={p.id} className={`source-paragraph ${validParagraph?.id === p.id ? 'selected' : ''}`}>
      <p className="source-page">PDF 第{p.page}页{validParagraph?.id === p.id ? ' · 本卡对应段落' : ''}</p>
      {p.heading && <h2>{p.heading}</h2>}{p.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
    </section>)}</article>
    {article.authorNote && <p className="hint">{article.authorNote}</p>}
    <div className="btn-row"><a className="btn-link" href={hrefs.previews(article.id)}>回到提炼卡</a><a className="btn-link" href={hrefs.previews()}>全部前瞻</a>{pdf && <a className="btn-link" href={pdf} download={article.sourceFile}>保存原始PDF</a>}</div>
  </main>;
  return <main ref={page} className="page previews" data-testid="official-article">
    <header className="page-head"><a className="btn-link" href={hrefs.previews()}>全部前瞻</a><span className="eyebrow">前瞻 {article.order}</span><h1>{article.title}</h1><p>{article.summary}</p><ArticleMeta article={article} /><a className="btn-link" href={hrefs.original(article.id)}>查看原文全文</a></header>
    <ol className="entries article-card-list">{article.cardIds.map((id, i) => {
      const c = cardById.get(id)!; return <li className="entry" key={id}><p className="eyebrow">{String(i + 1).padStart(2, '0')}{user.read.includes(id) ? ' · 已读' : ''}</p><h2><a href={hrefs.detail(id)}>{c.title}</a></h2><p>{c.takeaway}</p><div className="btn-row"><a className="btn-link" href={hrefs.detail(id)}>展开读卡</a><a className="btn-link" href={hrefs.original(article.id, c.evidenceIds?.[0])}>对应原文</a></div></li>;
    })}</ol>
    <section className="panel"><h2>关联日程</h2><Sessions article={article} /></section>
  </main>;
}
