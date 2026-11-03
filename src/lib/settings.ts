export type Theme = 'auto' | 'light' | 'dark';
export interface Settings { theme: Theme; fontLevel: number }

const KEY = 'lakang:settings';
export const FONT_SIZES = ['100%', '112.5%', '125%', '145%'];
export const FONT_LABELS = ['标准', '偏大', '大', '特大'];
export const THEMES: { id: Theme; label: string }[] = [{ id: 'auto', label: '跟随系统' }, { id: 'light', label: '浅色' }, { id: 'dark', label: '深色' }];

export function readSettings(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (v && typeof v === 'object' && THEMES.some((t) => t.id === v.theme) &&
      Number.isInteger(v.fontLevel) && v.fontLevel >= 0 && v.fontLevel < FONT_SIZES.length) return { theme: v.theme, fontLevel: v.fontLevel };
  } catch { /* fall through */ }
  return { theme: 'auto', fontLevel: 0 };
}

export function writeSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

export function applySettings(s: Settings): void {
  const root = document.documentElement;
  if (s.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = s.theme;
  root.style.fontSize = FONT_SIZES[s.fontLevel];
  const dark = s.theme === 'dark' || (s.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171514' : '#f6f3ee');
}
