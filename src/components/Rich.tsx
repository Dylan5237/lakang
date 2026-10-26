import { Fragment, type ReactNode } from 'react';
import { cardById } from '../data';
import { hrefs, navigate } from '../lib/router';

const KREF = /\b(K\d{3})\b/g;
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(KREF)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const target = cardById.get(m[1]);
    out.push(target ? (
      <a key={`${keyBase}-${at}`} className="xref" href={hrefs.card(target.id)} onClick={(e) => { e.preventDefault(); navigate(hrefs.card(target.id)); }}>
        「{target.title}」
      </a>
    ) : m[1]);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Small, text-only renderer: no arbitrary HTML or executable Markdown. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    blocks.push(<ul key={`ul${blocks.length}`}>{items.map((t, i) => <li key={i}>{inline(t, `l${blocks.length}-${i}`)}</li>)}</ul>);
    list = [];
  };
  text.split('\n').forEach((line, i) => {
    if (line.startsWith('- ')) list.push(line.slice(2));
    else if (line.trim()) {
      flush();
      if (line.startsWith('### ')) blocks.push(<h3 key={`h${i}`}>{inline(line.slice(4), `h${i}`)}</h3>);
      else blocks.push(<p key={`p${i}`}>{inline(line, `p${i}`)}</p>);
    } else flush();
  });
  flush();
  return <div className={className}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
