import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'feed'; cardId?: string; detail?: boolean }
  | { name: 'agenda'; day?: string; sessionId?: string }
  | { name: 'guide'; tab?: string }
  | { name: 'me' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case 'card':
      return parts[1] ? { name: 'feed', cardId: parts[1], detail: parts[2] === 'more' } : { name: 'feed' };
    case 'agenda':
      return { name: 'agenda', day: parts[1], sessionId: parts[2] };
    case 'guide':
      return { name: 'guide', tab: parts[1] };
    case 'me':
      return { name: 'me' };
    default:
      return { name: 'feed' };
  }
}

export const hrefs = {
  feed: () => '#/',
  card: (id: string) => `#/card/${id}`,
  detail: (id: string) => `#/card/${id}/more`,
  agenda: (day?: string, sessionId?: string) => `#/agenda${day ? `/${day}` : ''}${sessionId ? `/${sessionId}` : ''}`,
  guide: (tab?: string) => `#/guide${tab ? `/${tab}` : ''}`,
  me: () => '#/me',
};

const notify = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

export function navigate(href: string, opts: { replace?: boolean } = {}): void {
  if (href === location.hash) return;
  if (opts.replace) history.replaceState(history.state, '', href);
  else history.pushState({ lk: 1 }, '', href);
  notify();
}

export function closeDetail(cardId: string): void {
  if (history.state?.lk) history.back();
  else navigate(hrefs.card(cardId), { replace: true });
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener('popstate', cb);
  };
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => location.hash, () => '');
}
