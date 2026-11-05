// Build the public knowledge chunks for the site AI from content/*.json.
// Never reads clinical records: only cards, terms, paths.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const cards = read('../content/cards.json');
const terms = read('../content/terms.json');
const paths = read('../content/paths.json');

const termName = (id) => { const t = terms.find((x) => x.id === id); return t ? t.zh : ''; };
const chunks = [];
for (const c of cards) {
  const tags = [c.stageLabel, c.topic, ...c.termIds.map(termName)].filter(Boolean);
  chunks.push({
    id: c.id, type: 'card', title: c.title,
    text: [c.body, c.takeaway, ...c.detail, c.question, c.action].filter(Boolean).join('\n'),
    tags,
  });
}
for (const t of terms) {
  chunks.push({
    id: t.id, type: 'term', title: `${t.zh} ${t.original}`.trim(),
    text: [t.brief, t.detail].filter(Boolean).join('\n'),
    tags: [t.zh, t.original, ...(t.related ?? []).map(termName)].filter(Boolean),
  });
}
for (const p of paths) {
  chunks.push({
    id: p.id, type: 'path', title: p.title,
    text: `${p.intro}\n读完能够：${p.outcome}\n包含卡片：${p.cardIds.map((id) => cards.find((c) => c.id === id)?.title).filter(Boolean).join('；')}`,
    tags: ['阅读路径', p.title],
  });
}

const out = new URL('../server/knowledge/public.json', import.meta.url);
mkdirSync(dirname(out.pathname.replace(/^\/([A-Z]:)/, '$1')), { recursive: true });
writeFileSync(out, JSON.stringify(chunks, null, 1) + '\n');
console.log(`public knowledge: ${chunks.length} chunks -> server/knowledge/public.json`);
