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
    out.push(
      target ? (
        <a
          key={`${keyBase}-${at}`}
          className="xref"
          href={hrefs.card(target.id)}
          onClick={(e) => {
            e.preventDefault();
            navigate(hrefs.card(target.id));
          }}
        >
          「{target.title}」
        </a>
      ) : (
        m[1]
      ),
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    const items = list;
    blocks.push(
      <ul key={`ul${blocks.length}`}>
        {items.map((t, i) => (
          <li key={i}>{inline(t, `l${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith('- ')) list.push(line.slice(2));
    else if (line.trim()) {
      flush();
      blocks.push(<p key={`p${i}`}>{inline(line, `p${i}`)}</p>);
    }
  });
  flush();
  return (
    <div className={className}>
      {blocks.map((b, i) => (
        <Fragment key={i}>{b}</Fragment>
      ))}
    </div>
  );
}
