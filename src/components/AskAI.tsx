import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { askAI, type AiMessage } from '../lib/ai';
import { hrefs } from '../lib/router';

const SUGGESTIONS = [
  '除权和压抑有什么区别？',
  '三环纽结为什么说没有哪一环是基础？',
  '享乐和快乐有什么不同？',
  '我想入门，应该按什么顺序读？',
];

const sourceHref = (id: string, type: string) =>
  type === 'card' ? hrefs.cards(id) : type === 'term' ? hrefs.terms(id) : type === 'path' ? hrefs.paths(id) : null;

/** Newest delta renders as per-character spans; older text stays a single string. */
function StreamText({ content, from, batch }: { content: string; from?: number; batch?: number }) {
  if (from === undefined || from >= content.length) return <>{content}</>;
  const head = content.slice(0, from);
  const tail = [...content.slice(from)];
  return <>{head}{tail.map((ch, i) => (
    <span key={from + i} className="ask-tok"
      style={{ '--d': Math.min(Math.max(0, from + i - (batch ?? from + i)), 12) } as CSSProperties}>{ch}</span>
  ))}</>;
}

export function AskAI({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal(); else if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => { if (!enabled && open) setOpen(false); }, [enabled, open]);
  useEffect(() => {
    const el = scroller.current; if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const send = async (text: string) => {
    const q = text.trim().slice(0, 500);
    if (!q || streaming) return;
    setError(null); setInput('');
    const history = [...messages, { role: 'user' as const, content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setStreaming(true);
    const controller = new AbortController(); abort.current = controller;
    try {
      await askAI(history.map(({ role, content }) => ({ role, content })), {
        signal: controller.signal,
        onMeta: (sources) => setMessages((m) => {
          const next = [...m]; const last = next[next.length - 1];
          if (last?.role === 'assistant') next[next.length - 1] = { ...last, sources };
          return next;
        }),
        onDelta: (chunk) => setMessages((m) => {
          const next = [...m]; const last = next[next.length - 1];
          if (last?.role === 'assistant') {
            const at = last.content.length;
            const tail = last.animFrom === undefined ? 0 : at - last.animFrom;
            // Keep a short tail alive so the 90ms blur-in is not cut short by fast deltas.
            const from = last.animFrom !== undefined && tail < 24 ? last.animFrom : at;
            next[next.length - 1] = { ...last, content: last.content + chunk, animFrom: from, animBatch: at };
          }
          return next;
        }),
      });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message || '请求失败');
        setMessages((m) => m[m.length - 1]?.role === 'assistant' && !m[m.length - 1].content ? m.slice(0, -1) : m);
      }
    } finally {
      setStreaming(false); abort.current = null;
      // Fold the animated tail back into plain text once the stream ends.
      setMessages((m) => {
        const next = [...m]; const last = next[next.length - 1];
        if (last?.role === 'assistant' && last.animFrom !== undefined) next[next.length - 1] = { ...last, animFrom: undefined, animBatch: undefined };
        return next;
      });
    }
  };

  const close = () => { abort.current?.abort(); setOpen(false); };
  if (!enabled) return null;

  return <>
    <button type="button" className="ask-fab" aria-label="问一问" aria-haspopup="dialog" onClick={() => setOpen(true)} data-testid="ask-fab">
      <span aria-hidden="true">问</span><small>AI</small>
    </button>
    <dialog ref={dialog} className="ask-dialog" aria-label="拉康学习助手" data-testid="ask-dialog" onClose={() => setOpen(false)}>
      {open && <>
        <header className="ask-head">
          <div><h2>问一问</h2><p>基于本站公开学习资料与去标识的专家讨论要点</p></div>
          <div className="ask-head-tools">
            {messages.length > 0 && <button type="button" className="ghost" onClick={() => { abort.current?.abort(); setMessages([]); setError(null); }}>新对话</button>}
            <button type="button" className="ghost" onClick={close} aria-label="关闭">关闭</button>
          </div>
        </header>
        <div className="ask-thread" ref={scroller} aria-live="polite">
          {messages.length === 0 && <div className="ask-empty">
            <p className="muted">可以问概念、文本、学派差异或阅读顺序。回答优先使用站内材料；不足时会标明并延伸到拉康派的一般知识。</p>
            <div className="ask-suggestions">{SUGGESTIONS.map((s) => <button key={s} type="button" className="ask-chip" onClick={() => void send(s)}>{s}</button>)}</div>
          </div>}
          {messages.map((m, i) => <div key={i} className={`ask-msg ${m.role}`}>
            {m.role === 'assistant' && <span className="ask-who">助手</span>}
            <div className="ask-bubble" data-testid={m.role === 'assistant' ? 'ask-answer' : undefined}>
              {m.content
                ? <StreamText content={m.content} from={m.animFrom} batch={m.animBatch} />
                : streaming && i === messages.length - 1
                  ? <span className="ask-typing" role="status" aria-label="正在生成回答"><i /><i /><i /></span>
                  : null}
            </div>
            {m.role === 'assistant' && m.sources && m.sources.length > 0 && <div className="ask-sources" data-testid="ask-sources">
              <span className="muted">站内相关</span>
              {m.sources.map((s) => { const href = sourceHref(s.id, s.type); return href
                ? <a key={s.id} href={href} onClick={close}>{s.title}</a>
                : <span key={s.id}>{s.title}</span>; })}
            </div>}
          </div>)}
          {error && <p className="ask-error" role="alert">{error}</p>}
        </div>
        <form className="ask-composer" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <textarea value={input} rows={2} maxLength={500} aria-label="提问内容" placeholder="问一个拉康精神分析的问题…"
            data-testid="ask-input" onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }} />
          {streaming
            ? <button type="button" className="btn" onClick={() => abort.current?.abort()} data-testid="ask-stop">停止</button>
            : <button type="submit" className="btn primary" disabled={!input.trim()} data-testid="ask-send">发送</button>}
        </form>
        <p className="ask-note">AI 生成，可能出错；仅作学习参考，不提供诊疗。提问会发送到模型服务用于生成回答，本站不保存对话。</p>
      </>}
    </dialog>
  </>;
}
