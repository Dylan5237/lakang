import { hrefs, type Route } from '../lib/router';

const TABS = [
  { name: 'home', label: '学习', href: hrefs.home(), glyph: '学' },
  { name: 'cards', label: '概念卡', href: hrefs.cards(), glyph: '卡' },
  { name: 'paths', label: '路径', href: hrefs.paths(), glyph: '路' },
  { name: 'terms', label: '词典', href: hrefs.terms(), glyph: '词' },
  { name: 'me', label: '我的', href: hrefs.me(), glyph: '我' },
] as const;

/** Top-level destinations; the immersive pages (card deck, review, case reader) render without it. */
export const TAB_ROUTES: ReadonlySet<Route['name']> = new Set(['home', 'paths', 'terms', 'me', 'about']);

export function TabBar({ current }: { current: Route['name'] }) {
  const active = current === 'about' ? 'home' : current;
  return <nav className="tabbar" aria-label="主导航" data-testid="tabbar">
    {TABS.map((t) => <a key={t.name} href={t.href} className={t.name === active ? 'on' : ''} aria-current={t.name === active ? 'page' : undefined}>
      <span className="tab-ico" aria-hidden="true">{t.glyph}</span><span className="tab-label">{t.label}</span>
    </a>)}
  </nav>;
}
