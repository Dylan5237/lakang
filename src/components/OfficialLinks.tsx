import { officialArticleByCard, retiredCardIds } from '../data';
import type { Card } from '../types';
import { hrefs, navigate } from '../lib/router';
const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); navigate(href); };
export function CardOrigin({ card }: { card: Card }) {
  const article = officialArticleByCard.get(card.id);
  if (retiredCardIds.has(card.id)) return <p className="archive-note" data-testid="archive-note">已移入附录 · 原收藏与笔记保留 <a href={hrefs.previews('appendix')}>查看附录</a> <a href={hrefs.feed()}>回到主卡流</a></p>;
  if (!article) return null;
  return <div className="official-context" data-testid="official-origin">
    <a href={hrefs.previews(article.id)} onClick={go(hrefs.previews(article.id))}>前瞻 {article.order} · {article.title}</a>
    <a className="original-link" href={hrefs.original(article.id, card.evidenceIds?.[0])} onClick={go(hrefs.original(article.id, card.evidenceIds?.[0]))}>查看原文</a>
  </div>;
}
export function OfficialSequence({ cardId }: { cardId: string }) {
  const article = officialArticleByCard.get(cardId); if (!article) return null;
  const index = article.cardIds.indexOf(cardId);
  return <nav className="official-sequence" aria-label="前瞻连续阅读">
    <p>《{article.title}》 · {index + 1} / {article.cardIds.length}</p>
    <div className="btn-row">
      {index > 0 && <a className="btn-link" data-testid="official-previous" href={hrefs.detail(article.cardIds[index - 1])} onClick={go(hrefs.detail(article.cardIds[index - 1]))}>上一篇</a>}
      {index + 1 < article.cardIds.length && <a className="btn-link" data-testid="official-next" href={hrefs.detail(article.cardIds[index + 1])} onClick={go(hrefs.detail(article.cardIds[index + 1]))}>下一篇</a>}
      <a className="btn-link" href={hrefs.previews(article.id)}>文章目录</a>
    </div>
  </nav>;
}
