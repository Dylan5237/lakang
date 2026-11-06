// Lightweight Chinese-friendly retrieval over curated knowledge chunks.
// No external service: the same code runs locally in tests and on the site server.

const STOP = new Set(['什么', '怎么', '如何', '为何', '是否', '可以', '请问', '一下', '这个', '那个', '我们', '你们', '他们', '以及', '还是', '就是', '一个', '有没有', '什么样', '为什么', '没有', '一条', '推荐']);

export const normalize = (s) => String(s).normalize('NFKC').toLowerCase()
  .replace(/[\s　，。！？；：、“”‘’（）《》【】…—·,.!?;:'"()<>[\]{}/\\|@#$%^&*_+=~`-]/g, '');

/** Latin words + Chinese character bigrams (single chars for one-char queries). */
export function queryTokens(query) {
  const q = normalize(query);
  const tokens = new Set();
  for (const w of q.match(/[a-z0-9]+/g) ?? []) tokens.add(w);
  const han = q.replace(/[a-z0-9]+/g, '');
  if (han.length === 1) tokens.add(han);
  for (let i = 0; i + 1 < han.length; i++) {
    const bg = han.slice(i, i + 2);
    if (!STOP.has(bg)) tokens.add(bg);
  }
  return [...tokens];
}

function count(hay, needle) {
  if (!needle) return 0;
  let n = 0;
  for (let i = hay.indexOf(needle); i >= 0 && n < 3; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
}

/** Score one chunk; exported for tests. */
export function scoreChunk(chunk, query, tokens = queryTokens(query)) {
  const q = normalize(query);
  const title = normalize(chunk.title ?? '');
  const text = normalize(chunk.text ?? '');
  const tags = normalize((chunk.tags ?? []).join(' '));
  let score = 0;
  if (q && title.includes(q)) score += 14;
  if (q && text.includes(q)) score += 6;
  for (const t of tokens) {
    score += count(title, t) * 5;
    score += count(tags, t) * 3;
    score += count(text, t);
  }
  return score;
}

export function snippet(text, query, len = 96) {
  const q = normalize(query);
  const plain = String(text).replace(/\s+/g, ' ').trim();
  const low = normalize(plain);
  const i = q ? low.indexOf(q.slice(0, Math.min(4, q.length))) : -1;
  if (i < 0) return plain.slice(0, len) + (plain.length > len ? '…' : '');
  // normalize() may drop punctuation and change indices; fall back to a head snippet rather than mis-slicing.
  if (low.length !== plain.length) return plain.slice(0, len) + (plain.length > len ? '…' : '');
  const start = Math.max(0, i - 16);
  return (start > 0 ? '…' : '') + plain.slice(start, start + len) + (plain.length > start + len ? '…' : '');
}

/** 客户端只传概念卡编号：必须是 K+三位数字且存在于公开知识里，否则忽略，不信任客户端带来的任何其它内容。 */
export function pickCard(publicChunks, id) {
  if (typeof id !== 'string' || !/^K\d{3}$/.test(id)) return null;
  return publicChunks.find((c) => c.type === 'card' && c.id === id) ?? null;
}

/** Top matches across public and expert chunks. Experts are kept few and clearly labelled. */
export function retrieve(query, { publicChunks, expertChunks }, { publicLimit = 6, expertLimit = 4 } = {}) {
  const tokens = queryTokens(query);
  if (!tokens.length) return { public: [], experts: [] };
  const rank = (list, limit, minScore) => list
    .map((c) => ({ chunk: c, score: scoreChunk(c, query, tokens) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({ ...x.chunk, text: snippet(x.chunk.text, query) }));
  return { public: rank(publicChunks, publicLimit, 4), experts: rank(expertChunks, expertLimit, 6) };
}
