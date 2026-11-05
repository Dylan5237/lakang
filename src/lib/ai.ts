export interface AiSource { id: string; type: 'card' | 'term' | 'path' | 'expert'; title: string }
export interface AiMessage { role: 'user' | 'assistant'; content: string; sources?: AiSource[]; animFrom?: number; animBatch?: number }

/** POST /api/chat and consume the SSE stream. Meta arrives before the first token. */
export async function askAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  { signal, onMeta, onDelta }: { signal?: AbortSignal; onMeta?: (sources: AiSource[]) => void; onDelta: (text: string) => void },
): Promise<void> {
  const res = await fetch('api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = res.status === 429 ? '提问太频繁，请稍后再试。' : res.status === 502 ? '模型服务暂时不可用。' : '请求失败，请稍后再试。';
    try { const j = await res.json() as { error?: string }; if (j.error) msg = j.error; } catch { /* keep default */ }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE blocks are separated by a blank line; keep the trailing partial block for the next read.
    const blocks = buf.split(/\r?\n\r?\n/);
    buf = blocks.pop() ?? '';
    for (const block of blocks) {
      let event = 'message';
      const data: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
      }
      const payload = data.join('\n');
      if (!payload) continue;
      if (event === 'meta') {
        try { const meta = JSON.parse(payload) as { sources?: AiSource[] }; onMeta?.(meta.sources ?? []); } catch { /* ignore malformed meta */ }
        continue;
      }
      if (payload === '[DONE]') return;
      try {
        const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) onDelta(text);
      } catch { /* providers may send keep-alives */ }
    }
  }
}
