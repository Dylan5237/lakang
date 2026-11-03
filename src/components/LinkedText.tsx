import { splitLinks } from '../lib/study';

/** Plain text with K### mentions rendered as card links (content is plain text from content/). */
export function LinkedText({ text }: { text: string }) {
  return <>{splitLinks(text).map((p, i) => p.cardId
    ? <a key={i} className="kref" href={`#/cards/${p.cardId}`}>{p.text}</a>
    : <span key={i}>{p.text}</span>)}</>;
}
