import { useSyncExternalStore } from 'react';
import { hrefs, type Route } from '../lib/router';
import { getAiStatus, subscribeAiStatus } from '../lib/aiStatus';

const TABS = [
  { name: 'home', label: '学习', href: hrefs.home(), icon: 'M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z' },
  { name: 'cards', label: '概念卡', href: hrefs.cards(), icon: 'M6 4h12v16H6zM9 9h6M9 13h6' },
  { name: 'paths', label: '路径', href: hrefs.paths(), icon: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h4M18 9v6a4 4 0 0 1-4 4h-4' },
  { name: 'me', label: '我的', href: hrefs.me(), icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0' },
] as const;

/** Top-level destinations; immersive pages (card deck, review, case reader) render without it. */
export const TAB_ROUTES: ReadonlySet<Route['name']> = new Set(['home', 'paths', 'terms', 'me', 'about', 'ai']);

export function TabBar({ current }: { current: Route['name'] }) {
  const active = current === 'about' ? 'home' : current === 'terms' ? 'me' : current;
  const st = useSyncExternalStore(subscribeAiStatus, getAiStatus, getAiStatus);
  const label = st.phase === 'thinking' ? '思考中'
    : st.phase === 'streaming' ? '回答中'
      : st.unseen && st.phase === 'done' ? '已回答'
        : st.unseen && st.phase === 'error' ? '出错' : 'AI';
  const tab = (t: (typeof TABS)[number]) => <a key={t.name} href={t.href} data-testid={`tab-${t.name}`} className={t.name === active ? 'on' : ''} aria-current={t.name === active ? 'page' : undefined}>
    <svg className="tab-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg><span className="tab-label">{t.label}</span>
  </a>;
  return <nav className="tabbar" aria-label="主导航" data-testid="tabbar">
    {TABS.slice(0, 3).map(tab)}
    <a href={hrefs.ai()} className={`ai-tab ${st.phase} ${st.unseen ? 'unseen' : ''} ${active === 'ai' ? 'on' : ''}`}
      data-testid="tab-ai" aria-label={label === 'AI' ? '问 AI' : `问 AI，${label}`} aria-current={active === 'ai' ? 'page' : undefined}>
      <span className="ai-ico-wrap"><svg className="tab-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="7.5" width="15" height="12" rx="3.5" /><path d="M9.2 12.2v2.4M14.8 12.2v2.4M12 7.5V5" /><circle cx="12" cy="3.8" r="1.1" /></svg></span>
      <span className="tab-label">{label}</span>
    </a>
    {TABS.slice(3).map(tab)}
  </nav>;
}
