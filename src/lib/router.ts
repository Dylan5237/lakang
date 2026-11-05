import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'case'; caseId: string; tab: 'talk' | 'notes'; sectionId?: string }
  | { name: 'terms'; termId?: string }
  | { name: 'cards'; cardId?: string }
  | { name: 'review' }
  | { name: 'paths'; pathId?: string }
  | { name: 'about' }
  | { name: 'ai' }
  | { name: 'me' };

export function parseHash(hash: string): Route {
  let parts: string[];
  try { parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); }
  catch { return { name: 'home' }; }
  if (parts[0] === 'terms') return { name: 'terms', termId: parts[1] };
  if (parts[0] === 'cards') return { name: 'cards', cardId: parts[1] };
  if (parts[0] === 'review') return { name: 'review' };
  if (parts[0] === 'paths') return { name: 'paths', pathId: parts[1] };
  if (parts[0] === 'about') return { name: 'about' };
  if (parts[0] === 'me') return { name: 'me' };
  if (parts[0] === 'ai') return { name: 'ai' };
  if (parts[0] !== 'case' || !parts[1]) return { name: 'home' };
  if (parts[2] === 'notes') return { name: 'case', caseId: parts[1], tab: 'notes' };
  return { name: 'case', caseId: parts[1], tab: 'talk', sectionId: parts[2] === 's' ? parts[3] : undefined };
}

export const hrefs = {
  home: () => '#/',
  talk: (caseId: string, sectionId?: string) => `#/case/${caseId}${sectionId ? `/s/${sectionId}` : ''}`,
  notes: (caseId: string) => `#/case/${caseId}/notes`,
  terms: (id?: string) => `#/terms${id ? `/${id}` : ''}`,
  cards: (id?: string) => `#/cards${id ? `/${id}` : ''}`,
  review: () => '#/review',
  paths: (id?: string) => `#/paths${id ? `/${id}` : ''}`,
  about: () => '#/about',
  me: () => '#/me',
  ai: () => '#/ai',
};

export function navigate(href: string, replace = false): void {
  if (href === location.hash) return;
  if (replace) history.replaceState(null, '', href); else history.pushState(null, '', href);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb); window.addEventListener('popstate', cb);
  return () => { window.removeEventListener('hashchange', cb); window.removeEventListener('popstate', cb); };
}
export const useHash = () => useSyncExternalStore(subscribe, () => location.hash, () => '');
