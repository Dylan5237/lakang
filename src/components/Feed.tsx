import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cards } from '../data';
import type { Card } from '../types';
import { randomFeed } from '../lib/random-feed';
import { hrefs, navigate } from '../lib/router';
import { actions, getState, useUser } from '../lib/store';
import { CardView } from './CardView';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let stepper: ((dir: 1 | -1) => void) | null = null;
export const stepFeed = (dir: 1 | -1) => stepper?.(dir);
interface Props {
  list: Card[];
  filterKey: string;
  routeCardId?: string;
  filtered: boolean;
  onClearFilters: () => void;
}

export function Feed({ list, filterKey, routeCardId, filtered, onClearFilters }: Props) {
  const ref = useRef<HTMLElement>(null);
  const active = useRef<string | undefined>(undefined);
  const target = useRef<{ id: string; timer: number } | null>(null);
  const ready = useRef(false);
  const restarting = useRef(false);
  const [round, setRound] = useState(0);
  const user = useUser();
  // Freeze this permutation until the pool changes or a new round is requested.
  // Hash, read markers, favorites, notes and ordinary rerenders must not reshuffle it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ordered = useMemo(() => {
    const byId = new Map(list.map((c) => [c.id, c]));
    return randomFeed().get(list.map((c) => c.id), filterKey, routeCardId ?? getState().position)
      .map((id) => byId.get(id)!);
  }, [list, filterKey, round]);
  const ids = useMemo(() => ordered.map((c) => c.id), [ordered]);
  const el = (id: string) => ref.current?.querySelector<HTMLElement>(`[data-card-id="${id}"]`) ?? null;
  const jump = (id: string, smooth: boolean) => {
    const card = el(id);
    if (!card || !ref.current) return;
    ref.current.scrollTo({ top: card.offsetTop, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  };
  const syncHash = (id: string) => {
    if (location.hash.includes('/more')) return;
    const href = hrefs.card(id);
    if (location.hash !== href) {
      history.replaceState(history.state, '', href);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };
  const clearTarget = () => {
    if (target.current) window.clearTimeout(target.current.timer);
    target.current = null;
  };
  const restart = () => {
    if (!list.length) return;
    clearTarget();
    randomFeed().renew(list.map((c) => c.id), filterKey, active.current);
    restarting.current = true;
    setRound((n) => n + 1);
  };

  useLayoutEffect(() => {
    ready.current = false;
    clearTarget();
    const position = getState().position;
    const first = restarting.current ? ids[0]
      : routeCardId && ids.includes(routeCardId) ? routeCardId
      : position && ids.includes(position) ? position : ids[0];
    restarting.current = false;
    if (ref.current) ref.current.scrollTop = 0;
    active.current = first;
    if (first) {
      jump(first, false);
      actions.setPosition(first);
      syncHash(first);
    }
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
    if (routeCardId && routeCardId !== active.current && ids.includes(routeCardId)) {
      clearTarget();
      active.current = routeCardId;
      // Direct links can be far away in a random deck; do not animate through unrelated cards.
      jump(routeCardId, false);
      actions.setPosition(routeCardId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCardId]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || !ready.current) continue;
        const id = (e.target as HTMLElement).dataset.cardId;
        if (target.current && id !== target.current.id) continue;
        if (target.current) clearTarget();
        if (id && id !== active.current) {
          active.current = id;
          actions.setPosition(id);
          syncHash(id);
        }
      }
    }, { root, rootMargin: '-35% 0px -64% 0px', threshold: 0 });
    root.querySelectorAll('[data-card-id]').forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
    stepper = (dir) => {
      const i = ids.indexOf(target.current?.id ?? active.current ?? '');
      if (dir === 1 && i === ids.length - 1 && ids.length > 1) { restart(); return; }
      const next = ids[Math.min(ids.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
      if (!next) return;
      clearTarget();
      target.current = { id: next, timer: window.setTimeout(() => (target.current = null), 900) };
      jump(next, true);
    };
    return () => { stepper = null; clearTarget(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== ref.current) return;
    if (e.key === 'j' || e.key === 'J') stepFeed(1);
    if (e.key === 'k' || e.key === 'K') stepFeed(-1);
  };
  const readCount = user.read.filter((id) => cards.some((c) => c.id === id)).length;
  return <main className="feed" ref={ref} tabIndex={0} aria-label="随机知识卡片，上下滑动切换；j/k 切换" onKeyDown={onKey} data-testid="feed" data-order="random">
    {ordered.map((c, i) => <CardView key={c.id} card={c} index={i} total={ordered.length} fav={user.favorites.includes(c.id)} read={user.read.includes(c.id)} hasNote={Boolean(user.notes[c.id])} />)}
    <section className="card end" data-end>
      <div className="card-inner">
        {list.length === 0 ? <><h2 className="card-title">没有符合条件的卡片</h2><p className="card-body">换一个筛选条件，或清除后继续随机刷卡。</p></>
          : <><h2 className="card-title">这一轮刷完了</h2><p className="card-body">本轮随机排列、不重复。已读 {readCount} / {cards.length} 张；可以重新洗牌再刷一轮，或进入专题连续精读。</p></>}
      </div>
      <div className="end-actions">
        {filtered && <button type="button" className="btn" onClick={onClearFilters}>清除筛选</button>}
        {list.length > 0 && <button type="button" className="btn" onClick={restart}>再随机一轮</button>}
        <button type="button" className="btn" onClick={() => navigate(hrefs.agenda())}>看日程</button>
      </div>
    </section>
  </main>;
}
