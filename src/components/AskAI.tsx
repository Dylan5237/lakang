import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { getChat, resetChat, sendChat, setChatVisible, stopChat, subscribeChat } from '../lib/aiChat';
import { markAiSeen } from '../lib/aiStatus';
import { hrefs, navigate } from '../lib/router';

const SUGGESTIONS = [
  '除权和压抑有什么区别？',
  '三环纽结为什么说没有哪一环是基础？',
  '享乐和快乐有什么不同？',
  '我想入门，应该按什么顺序读？',
];

const sourceHref = (id: string, type: string) =>
  type === 'card' ? hrefs.cards(id) : type === 'term' ? hrefs.terms(id) : type === 'path' ? hrefs.paths(id) : null;

/** Compact entry on immersive pages that do not render the tab bar. */
export function AskAIButton() {
  return <a className="tool icon ask-tool" href={hrefs.ai()} aria-label="问 AI" data-testid="ask-open">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5z" /><path d="M8 9h8M8 12h5" /></svg>
  </a>;
}

/** Reasoning stream: open while thinking, fold to a one-line summary when the answer starts. */
function Thinking({ text, answerAt, live }: { text: string; answerAt?: number; live: boolean }) {
  const [open, setOpen] = useState(true);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!live) setOpen(false); }, [live]);
  useEffect(() => { const el = body.current; if (!el) return; if (open && live) el.scrollTop = el.scrollHeight; else if (open) el.scrollTop = 0; }, [text, open, live]);
  const secs = answerAt ? Math.max(1, Math.round(answerAt / 1000)) : null;
  return <div className={`ask-think ${open ? 'open' : ''}`} data-testid="ask-thinking">
    <button type="button" className="ask-think-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
      {live && <span className="ask-think-dot" aria-hidden="true" />}
      <span>{live ? '思考中' : '思考过程'}</span>
      {secs !== null && <small>{secs}s</small>}
      <span className="ask-think-ico" aria-hidden="true">⌄</span>
    </button>
    <div className={`ask-think-grid ${open ? 'open' : ''}`} inert={!open}>
      <div className="ask-think-inner"><div className="ask-think-text" ref={body}>{text}</div></div>
    </div>
  </div>;
}

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

export function AskAIPage() {
  const { messages, streaming, error } = useSyncExternalStore(subscribeChat, getChat, getChat);
  const [input, setInput] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatVisible(true);
    markAiSeen();
    return () => setChatVisible(false);
  }, []);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, streaming]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;
    setInput('');
    void sendChat(q);
  };
  const back = () => { if (history.length > 1) history.back(); else navigate(hrefs.home(), true); };

  return <main className="page ai-page" data-testid="ai-page">
    <header className="appbar">
      <button type="button" className="back" aria-label="返回" onClick={back}>‹</button>
      <div className="appbar-title"><h1>问一问</h1><p>基于本站公开学习资料与去标识的专家讨论要点</p></div>
      {messages.length > 0 && <button type="button" className="ghost" onClick={resetChat}>新对话</button>}
    </header>
    <div className="ask-thread" ref={scroller} aria-live="polite">
      {messages.length === 0 && <div className="ask-empty">
        <p className="muted">可以问概念、文本、学派差异或阅读顺序。回答前会先展示思考过程；回答优先使用站内材料，不足时会标明并延伸到拉康派的一般知识。</p>
        <div className="ask-suggestions">{SUGGESTIONS.map((s) => <button key={s} type="button" className="ask-chip" onClick={() => send(s)}>{s}</button>)}</div>
      </div>}
      {messages.map((m, i) => <div key={i} className={`ask-msg ${m.role}`}>
        {m.role === 'assistant' && <span className="ask-who">助手</span>}
        {m.role === 'assistant' && m.thinking && <Thinking text={m.thinking} answerAt={m.answerAt} live={streaming && !m.content && i === messages.length - 1} />}
        {(m.content || (m.role === 'assistant' && !m.thinking && streaming && i === messages.length - 1)) && <div className="ask-bubble" data-testid={m.role === 'assistant' ? 'ask-answer' : undefined}>
          {m.content
            ? <StreamText content={m.content} from={m.animFrom} batch={m.animBatch} />
            : <span className="ask-typing" role="status" aria-label="正在生成回答"><i /><i /><i /></span>}
        </div>}
        {m.role === 'assistant' && m.sources && m.sources.length > 0 && <div className="ask-sources" data-testid="ask-sources">
          <span className="muted">站内相关</span>
          {m.sources.map((s) => { const href = sourceHref(s.id, s.type); return href
            ? <a key={s.id} href={href}>{s.title}</a>
            : <span key={s.id}>{s.title}</span>; })}
        </div>}
      </div>)}
      {error && <p className="ask-error" role="alert">{error}</p>}
    </div>
    <form className="ask-composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
      <textarea value={input} rows={2} maxLength={500} aria-label="提问内容" placeholder="问一个拉康精神分析的问题…"
        data-testid="ask-input" onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} />
      {streaming
        ? <button type="button" className="btn" onClick={stopChat} data-testid="ask-stop">停止</button>
        : <button type="submit" className="btn primary" disabled={!input.trim()} data-testid="ask-send">发送</button>}
    </form>
    <p className="ask-note">AI 生成，可能出错；仅作学习参考，不提供诊疗。提问会发送到模型服务用于生成回答，本站不保存对话。</p>
  </main>;
}
