import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { getChat, resetChat, sendChat, setChatVisible, stopChat, subscribeChat } from '../lib/aiChat';
import { markAiSeen } from '../lib/aiStatus';
import { hrefs, navigate } from '../lib/router';
import { LogoMark } from './Logo';

const SUGGESTIONS = [
  { k: '辨', q: '除权和压抑有什么区别？' },
  { k: '结', q: '三环纽结为何没有基础？' },
  { k: '乐', q: '享乐和快乐有什么不同？' },
  { k: '径', q: '入门应该按什么顺序读？' },
];

const sourceHref = (id: string, type: string) =>
  type === 'card' ? hrefs.cards(id) : type === 'term' ? hrefs.terms(id) : type === 'path' ? hrefs.paths(id) : null;

function SparkIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 4.5c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7zM18.5 3.5v3M17 5h3" />
  </svg>;
}

/** Compact entry on immersive pages that do not render the tab bar. */
export function AskAIButton() {
  return <a className="tool icon ask-tool" href={hrefs.ai()} aria-label="问 AI" data-testid="ask-open">
    <SparkIcon />
  </a>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  };
  return <button type="button" className={`ask-act ${copied ? 'copied' : ''}`} onClick={() => void copy()} data-testid="ask-copy" aria-label={copied ? '已复制' : '复制'} title={copied ? '已复制' : '复制'}>
    <svg viewBox="0 0 24 24" aria-hidden="true">{copied
      ? <path d="M5 12.5l4.2 4.2L19 6.5" />
      : <><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" /></>}
    </svg>
  </button>;
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
      <span className="ask-think-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    <div className={`ask-think-grid ${open ? 'open' : ''}`} inert={!open}>
      <div className="ask-think-inner"><div className="ask-think-text" ref={body}>{text.trimStart()}</div></div>
    </div>
  </div>;
}

/** Newest delta renders as per-character spans; older text stays a single string. */
function StreamText({ content, from, batch }: { content: string; from?: number; batch?: number }) {
  const text = content.replace(/\*\*/g, '');
  if (from === undefined || from >= text.length) return <>{text}</>;
  const head = text.slice(0, from);
  const tail = [...text.slice(from)];
  return <>{head}{tail.map((ch, i) => (
    <span key={from + i} className="ask-tok"
      style={{ '--d': Math.min(Math.max(0, from + i - (batch ?? from + i)), 12) } as CSSProperties}>{ch}</span>
  ))}</>;
}

export function AskAIPage() {
  const { messages, streaming, error } = useSyncExternalStore(subscribeChat, getChat, getChat);
  const [input, setInput] = useState('');
  const [deep, setDeep] = useState(() => { try { return localStorage.getItem('lakang:ai-deep') === '1'; } catch { return false; } });
  const [tip, setTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setChatVisible(true);
    markAiSeen();
    return () => setChatVisible(false);
  }, []);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = messages.length ? el.scrollHeight : 0; }, [messages, streaming]);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [input]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;
    setInput('');
    void sendChat(q, deep);
  };
  const toggleDeep = () => setDeep((d) => {
    const next = !d;
    try { localStorage.setItem('lakang:ai-deep', next ? '1' : '0'); } catch { /* private mode */ }
    return next;
  });
  useEffect(() => () => { if (tipTimer.current) clearTimeout(tipTimer.current); }, []);
  const toggleTip = () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    if (tip) { setTip(false); return; }
    setTip(true);
    tipTimer.current = setTimeout(() => setTip(false), 6000);
  };
  const back = () => { if (history.length > 1) history.back(); else navigate(hrefs.home(), true); };

  return <main className="page ai-page" data-testid="ai-page">
    <header className="ai-top">
      <button type="button" className="ai-icon-btn" aria-label="返回" onClick={back}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <div className="ai-title">
        <h1>问一问</h1>
        <button type="button" className="ai-info" aria-label="使用说明" aria-expanded={tip} aria-controls="ai-tip" onClick={toggleTip}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.01" /></svg>
        </button>
      </div>
      <button type="button" className="ai-icon-btn" aria-label="新对话" onClick={resetChat} disabled={messages.length === 0}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5H6.5A2.5 2.5 0 0 0 4 7.5v10A2.5 2.5 0 0 0 6.5 20h10a2.5 2.5 0 0 0 2.5-2.5V12M17.4 4.6a1.6 1.6 0 0 1 2.3 2.3L11.5 15l-3.2.9.9-3.2z" /></svg>
      </button>
    </header>
    <p id="ai-tip" className={`ai-tip ${tip ? 'show' : ''}`} role="status">AI 生成，可能出错；仅作学习参考，不提供诊疗。提问会发送到模型服务，本站不保存对话。</p>
    <div className={`ask-thread ${messages.length === 0 ? 'at-rest' : ''}`} ref={scroller} aria-live="polite">
      {messages.length === 0 && <div className="ask-empty">
        <div className="ask-hero">
          <LogoMark className="ask-hero-mark" />
          <h2>有什么想弄清的？</h2>
          <p>基于站内资料与专家要点，回答概念、文本与阅读顺序。</p>
        </div>
        <ul className="ask-suggestions">{SUGGESTIONS.map((s) => <li key={s.q}>
          <button type="button" className="ask-chip" onClick={() => send(s.q)}>
            <span className="ask-chip-text">{s.q}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </li>)}</ul>
      </div>}
      {messages.map((m, i) => {
        const last = i === messages.length - 1;
        return m.role === 'user'
          ? <div key={i} className="ask-msg user"><div className="ask-user">{m.content}</div></div>
          : <div key={i} className="ask-msg assistant">
            {m.thinking && <Thinking text={m.thinking} answerAt={m.answerAt} live={streaming && !m.content && last} />}
            {m.content && <div className="ask-prose" data-testid="ask-answer"><StreamText content={m.content} from={m.animFrom} batch={m.animBatch} /></div>}
            {m.sources && m.sources.length > 0 && !(streaming && last) && <div className="ask-sources" data-testid="ask-sources">
              <span className="ask-src-label">依据</span>
              {m.sources.map((s) => { const href = sourceHref(s.id, s.type); return href
                ? <a key={s.id} href={href}>{s.title}</a>
                : <span key={s.id}>{s.title}</span>; })}
            </div>}
            <div className="ask-foot">
              <LogoMark className={`ask-foot-mark ${streaming && last ? 'busy' : ''}`} />
              {streaming && last && !m.content && !m.thinking && <span className="ask-working" role="status">正在生成回答…</span>}
              {m.content && !(streaming && last) && <CopyButton text={m.content} />}
            </div>
          </div>;
      })}
      {error && <p className="ask-error" role="alert">{error}</p>}
    </div>
    <div className="ask-dock">
      <form className="ask-composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea ref={inputRef} value={input} rows={1} maxLength={500} aria-label="提问内容" placeholder="问一个拉康精神分析的问题…"
          data-testid="ask-input" onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }} />
        <div className="ask-tools">
          <button type="button" className={`ask-deep ${deep ? 'on' : ''}`} aria-pressed={deep} data-testid="ask-deep" onClick={toggleDeep}>
            <span className="ask-deep-pill"><SparkIcon />深度思考</span>
          </button>
          {streaming
            ? <button type="button" className="ask-send stop" onClick={stopChat} aria-label="停止" data-testid="ask-stop"><span className="ask-stop-square" /></button>
            : <button type="submit" className="ask-send" disabled={!input.trim()} aria-label="发送" data-testid="ask-send">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
            </button>}
        </div>
      </form>
    </div>
  </main>;
}
