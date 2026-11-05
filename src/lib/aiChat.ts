import { askAI, type AiMessage } from './ai';
import { setAiStatus } from './aiStatus';

export interface ChatState { messages: AiMessage[]; streaming: boolean; error: string | null }

let state: ChatState = { messages: [], streaming: false, error: null };
let visible = false;
let controller: AbortController | null = null;
const listeners = new Set<() => void>();
let pendingThinking = '';
let thinkingTimer: ReturnType<typeof setTimeout> | null = null;

const update = (patch: Partial<ChatState>) => {
  state = { ...state, ...patch };
  listeners.forEach((cb) => cb());
};
const patchLast = (messages: AiMessage[], fn: (m: AiMessage) => AiMessage) => {
  const next = [...messages]; const last = next[next.length - 1];
  if (last?.role === 'assistant') next[next.length - 1] = fn(last);
  return next;
};
const flushThinking = () => {
  thinkingTimer = null;
  if (!pendingThinking) return;
  const text = pendingThinking; pendingThinking = '';
  update({ messages: patchLast(state.messages, (m) => ({ ...m, thinking: (m.thinking ?? '') + text })) });
};
const queueThinking = (chunk: string) => {
  pendingThinking += chunk;
  if (!thinkingTimer) thinkingTimer = setTimeout(flushThinking, 50);
};
const clearThinking = () => {
  if (thinkingTimer) { clearTimeout(thinkingTimer); thinkingTimer = null; }
  pendingThinking = '';
};

export const subscribeChat = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export const getChat = () => state;
export const setChatVisible = (v: boolean) => { visible = v; };

export async function sendChat(text: string, deep = false) {
  const q = text.trim().slice(0, 500);
  if (!q || state.streaming) return;
  const history = [...state.messages, { role: 'user' as const, content: q }];
  clearThinking();
  update({ messages: [...history, { role: 'assistant', content: '', thinking: '' }], streaming: true, error: null });
  setAiStatus('thinking');
  const started = Date.now();
  let answerAt = 0; let gotContent = false; let failed = false;
  const c = new AbortController(); controller = c;
  try {
    await askAI(history.map(({ role, content }) => ({ role, content })), {
      signal: c.signal,
      deep,
      onMeta: (sources) => update({ messages: patchLast(state.messages, (m) => ({ ...m, sources })) }),
      onThinking: queueThinking,
      onDelta: (chunk) => {
        flushThinking();
        update({
          messages: patchLast(state.messages, (m) => {
            const at = m.content.length;
            const tail = m.animFrom === undefined ? 0 : at - m.animFrom;
            const from = m.animFrom !== undefined && tail < 24 ? m.animFrom : at;
            if (!at && !answerAt) answerAt = Date.now() - started;
            return { ...m, content: m.content + chunk, animFrom: from, animBatch: at, answerAt };
          }),
        });
        if (!gotContent) { gotContent = true; setAiStatus('streaming'); }
      },
    });
  } catch (e) {
    flushThinking();
    if ((e as Error).name !== 'AbortError') {
      failed = true;
      setAiStatus('error', !visible);
      update({
        error: (e as Error).message || '请求失败',
        messages: state.messages.length && state.messages[state.messages.length - 1].role === 'assistant'
          && !state.messages[state.messages.length - 1].content && !state.messages[state.messages.length - 1].thinking
          ? state.messages.slice(0, -1) : state.messages,
      });
    }
  } finally {
    flushThinking();
    controller = null;
    update({
      streaming: false,
      messages: patchLast(state.messages, (m) => (m.animFrom === undefined ? m : { ...m, animFrom: undefined, animBatch: undefined })),
    });
    if (c.signal.aborted) setAiStatus('idle');
    else if (!failed) setAiStatus(gotContent ? (visible ? 'idle' : 'done') : 'idle', gotContent && !visible);
  }
}

export function stopChat() {
  controller?.abort();
  setAiStatus('idle');
}

export function resetChat() {
  controller?.abort();
  controller = null;
  clearThinking();
  setAiStatus('idle');
  update({ messages: [], streaming: false, error: null });
}
