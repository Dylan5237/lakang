// 拉康随身读 · 线上学习助手
// 浏览器 → 本服务 /api/chat → 火山方舟（OpenAI 兼容 SSE）
// 约束：只加载公开学习资料与去标识的专家讨论要点；不读取、不转发任何临床演示记录。
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pickCard, retrieve } from './retrieval.mjs';

const ARK_KEY = process.env.ARK_API_KEY;
const ARK_MODEL = process.env.ARK_MODEL || 'doubao-seed-2.1-lite';
const ARK_URL = process.env.ARK_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3/chat/completions';
const PORT = Number(process.env.PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR || fileURLToPath(new URL('./knowledge/', import.meta.url));
const MAX_MESSAGES = 12;
const MAX_CHARS = 12_000;
const MAX_OUTPUT = 1_500;
const DEEP_EFFORT = process.env.ARK_REASONING_EFFORT || 'low';

if (!ARK_KEY) { console.error('[fatal] 缺少环境变量 ARK_API_KEY'); process.exit(1); }

const load = (name, fallback = []) => {
  const path = `${KNOWLEDGE_DIR}${name}`;
  if (!existsSync(path)) { console.warn(`[warn] 缺少知识文件 ${path}`); return fallback; }
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { console.error(`[fatal] 知识文件无法解析 ${path}: ${String(e)}`); process.exit(1); }
};
const publicChunks = load('public.json');
const expertChunks = load('experts.json');
if (!publicChunks.length) { console.error('[fatal] 公开知识为空'); process.exit(1); }

const SYSTEM = `你是「拉康随身读」的线上学习助手，具有拉康派精神分析的理论背景，面向中文读者回答概念、文本、学派差异与学习路径的问题。

回答规则：
1. 优先使用下面提供的【站内材料】和【专家讨论要点】。材料够用时直接用，不必逐条引用编号。
2. 材料不足时，可以基于拉康派的理论知识扩展到站外内容，但必须先用一句“以下是超出本站材料的延伸：”标明；不确定的研讨班编号、页码或原文措辞不要编造，宁可说明记不清。
3. 区分理论归属：拉康本人、不同拉康派传统或研究者、以及你自己的概括，不要把某一种读法说成“拉康派都认为”。
4. 不诊断、不提供治疗或用药建议、不分析提问者本人；涉及临床时只讨论理论结构。若用户询问具体临床演示内容，回答：线上助手不接触案例记录，只能在理论层面讨论。
5. 不复述、不索要任何个案信息。
6. 中文回答；先直接回答问题，再给必要的区分、例子或阅读方向。篇幅以说清为准，避免空泛铺陈。
7. 可自然提到站内卡片或术语的标题与编号，但编号只能使用材料中出现的；不要伪造 K###、T## 编号。
8. 思考过程保持简短：只列关键判断与必要区分，不复述问题、不逐条自我检查、不展开无关联想；随后直接回答。
9. 用纯文本回答：不要使用 Markdown 标记（**、###、反引号、表格等）；分点用「1.」「2.」或中文序号。`;

function buildPrompt(question, hits, card) {
  const site = hits.public.length
    ? hits.public.map((c) => `- [${c.type === 'term' ? '术语' : c.type === 'path' ? '路径' : '卡片'}] ${c.id}《${c.title}》\n  ${c.text.replace(/\n/g, '\n  ')}`).join('\n')
    : '（本次没有检索到直接相关的站内材料。）';
  const experts = hits.experts.length
    ? hits.experts.map((c) => `- ${c.title}（${c.who}）\n  ${c.text.replace(/\n/g, '\n  ')}`).join('\n')
    : '（本次没有直接相关的专家讨论要点。）';
  const reading = card
    ? `\n【用户正在阅读的概念卡】（用户说“这张卡”“它”“这个概念”时，指这一张；仍以【用户问题】为主，不必复述卡片）\n${card.id}《${card.title}》\n${card.text.slice(0, 1800)}\n`
    : '';
  return `${SYSTEM}

【站内材料】
${site}
${reading}
【专家讨论要点（已去除全部个案信息，只保留理论表述；只作理论参考）】
${experts}

【用户问题】
${question}`;
}

/* ---- 限流：每 IP 每分钟 20 次，全局限每分钟 80 次；不记录提问内容 ---- */
const perIp = new Map();
let globalRec = { n: 0, t: Date.now() };
function limited(ip) {
  const now = Date.now();
  if (now - globalRec.t > 60_000) globalRec = { n: 0, t: now };
  globalRec.n++;
  if (globalRec.n > 80) return 'global';
  const rec = perIp.get(ip) ?? { n: 0, t: now };
  if (now - rec.t > 60_000) { rec.n = 0; rec.t = now; }
  rec.n++; perIp.set(ip, rec);
  if (perIp.size > 5000) perIp.clear();
  return rec.n > 20 ? 'ip' : null;
}

const json = (res, status, body, cors) => {
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, model: ARK_MODEL, publicChunks: publicChunks.length, expertChunks: expertChunks.length }, cors);
  if (req.method !== 'POST' || req.url !== '/api/chat') { res.writeHead(404, cors); return res.end('not found'); }

  // Behind nginx the socket peer is always loopback; trust X-Real-IP only from there.
  const peer = req.socket.remoteAddress || 'unknown';
  const ip = (peer === '127.0.0.1' || peer === '::1' || peer === '::ffff:127.0.0.1') && typeof req.headers['x-real-ip'] === 'string'
    ? req.headers['x-real-ip']
    : peer;
  const why = limited(ip);
  if (why) return json(res, 429, { error: why === 'global' ? '当前提问较多，请稍后再试' : '请求太频繁，请稍后再试' }, cors);

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) { res.writeHead(413, cors); return res.end('payload too large'); }
  }
  let payload;
  try { payload = JSON.parse(body || '{}'); } catch { return json(res, 400, { error: 'invalid json' }, cors); }

  const messages = (Array.isArray(payload.messages) ? payload.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const question = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim();
  if (!question) return json(res, 400, { error: 'messages 不能为空' }, cors);
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return json(res, 413, { error: '内容过长' }, cors);

  const hits = retrieve(question, { publicChunks, expertChunks });
  const system = buildPrompt(question, hits, pickCard(publicChunks, payload.card));

  let upstream;
  try {
    upstream = await fetch(ARK_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ARK_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ARK_MODEL,
        messages: [{ role: 'system', content: system }, ...messages],
        stream: true,
        reasoning_effort: payload.deep === true ? DEEP_EFFORT : 'minimal',
        max_tokens: Math.min(MAX_OUTPUT, Number(payload.max_tokens) || MAX_OUTPUT),
        temperature: Math.min(1, Math.max(0, Number(payload.temperature) || 0.6)),
      }),
    });
  } catch (e) {
    console.error('[upstream] network', String(e));
    return json(res, 502, { error: '连不上模型服务' }, cors);
  }
  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error('[upstream]', upstream.status, detail.slice(0, 200));
    return json(res, 502, { error: '模型服务返回错误' }, cors);
  }

  res.writeHead(200, {
    ...cors,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const meta = {
    sources: hits.public.map((c) => ({ id: c.id, type: c.type, title: c.title })),
    experts: hits.experts.length,
  };
  res.write(`event: meta\ndata: ${JSON.stringify(meta)}\n\n`);

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  } catch (e) {
    console.error('[stream]', String(e));
  } finally {
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`[ready] http://127.0.0.1:${PORT} model=${ARK_MODEL} public=${publicChunks.length} experts=${expertChunks.length}`));
