import { hrefs, type Route } from '../lib/router';

const TABS = [
  { name: 'home', label: '学习', href: hrefs.home(), icon: 'M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z' },
  { name: 'cards', label: '概念卡', href: hrefs.cards(), icon: 'M6 4h12v16H6zM9 9h6M9 13h6' },
  { name: 'paths', label: '路径', href: hrefs.paths(), icon: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h4M18 9v6a4 4 0 0 1-4 4h-4' },
  { name: 'terms', label: '词典', href: hrefs.terms(), icon: 'M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 8h6' },
  { name: 'me', label: '我的', href: hrefs.me(), icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0' },
] as const;

/** Top-level destinations; the immersive pages (card deck, review, case reader) render without it. */
export const TAB_ROUTES: ReadonlySet<Route['name']> = new Set(['home', 'paths', 'terms', 'me', 'about']);

export function TabBar({ current }: { current: Route['name'] }) {
  const active = current === 'about' ? 'home' : current;
  return <nav className="tabbar" aria-label="主导航" data-testid="tabbar">
    {TABS.map((t) => <a key={t.name} href={t.href} data-testid={`tab-${t.name}`} className={t.name === active ? 'on' : ''} aria-current={t.name === active ? 'page' : undefined}>
      <svg className="tab-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg><span className="tab-label">{t.label}</span>
    </a>)}
  </nav>;
}
