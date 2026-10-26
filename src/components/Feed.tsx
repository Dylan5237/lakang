import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { cards } from '../data';
import type { Card } from '../types';
import { startCard } from '../lib/filter';
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
  const user = useUser();
  const ids = useMemo(() => list.map((c) => c.id), [list]);

  const el = (id: string) => ref.current?.querySelector<HTMLElement>(`[data-card-id="${id}"]`) ?? null;
  const jump = (id: string, smooth: boolean) => {
    const target = el(id);
    if (!target || !ref.current) return;
    ref.current.scrollTo({ top: target.offsetTop, behavior: smooth && !reduced() ? 'smooth' : 'auto' });
  };
  const syncHash = (id: string) => {
    if (location.hash.includes('/more')) return;
    const href = hrefs.card(id);
    if (location.hash !== href) {
      history.replaceState(history.state, '', href);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  useLayoutEffect(() => {
    ready.current = false;
    const first = routeCardId && ids.includes(routeCardId) ? routeCardId : startCard(list, getState())?.id;
    if (ref.current) ref.current.scrollTop = 0;
    if (first) {
      jump(first, false);
      active.current = first;
      syncHash(first);
    } else {
      active.current = undefined;
    }
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (routeCardId && routeCardId !== active.current && ids.includes(routeCardId)) {
      active.current = routeCardId;
      jump(routeCardId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCardId]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || !ready.current) continue;
          const id = (e.target as HTMLElement).dataset.cardId;
          if (target.current && id !== target.current.id) continue;
          if (target.current) {
            window.clearTimeout(target.current.timer);
            target.current = null;
          }
          if (id && id !== active.current) {
            active.current = id;
            actions.setPosition(id);
            syncHash(id);
          }
        }
      },
      { root, rootMargin: '-35% 0px -64% 0px', threshold: 0 },
    );
    root.querySelectorAll('[data-card-id]').forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    stepper = (dir) => {
      const i = ids.indexOf(target.current?.id ?? active.current ?? '');
      const next = ids[Math.min(ids.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
      if (!next) return;
      // 平滑滚动途中连按“下一张”要接着往后走；途中经过的卡片不写入位置
      if (target.current) window.clearTimeout(target.current.timer);
      target.current = { id: next, timer: window.setTimeout(() => (target.current = null), 900) };
      jump(next, true);
    };
    return () => {
      stepper = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== ref.current) return;
    if (e.key === 'j' || e.key === 'J') stepFeed(1);
    if (e.key === 'k' || e.key === 'K') stepFeed(-1);
  };

  return (
    <main className="feed" ref={ref} tabIndex={0} aria-label="知识卡片，上下滑动切换；j/k 切换" onKeyDown={onKey} data-testid="feed">
      {list.map((c, i) => (
        <CardView
          key={c.id}
          card={c}
          index={i}
          total={list.length}
          fav={user.favorites.includes(c.id)}
          read={user.read.includes(c.id)}
          hasNote={Boolean(user.notes[c.id])}
        />
      ))}
      <section className="card end" data-end>
        <div className="card-inner">
          {list.length === 0 ? (
            <>
              <h2 className="card-title">没有符合条件的卡片</h2>
              <p className="card-body">换一个筛选条件，或清除后回到完整路径。</p>
            </>
          ) : (
            <>
              <h2 className="card-title">{filtered ? '这一组读完了' : '这条路径读完了'}</h2>
              <p className="card-body">
                已读 {user.read.length} / {cards.length}。可以回到开头重读、去日程里对照场次，或在「我的」里整理收藏与笔记。
              </p>
            </>
          )}
          <div className="end-actions">
            {filtered && (
              <button type="button" className="btn" onClick={onClearFilters}>
                清除筛选
              </button>
            )}
            {list.length > 0 && (
              <button type="button" className="btn" onClick={() => jump(ids[0], true)}>
                回到开头
              </button>
            )}
            <button type="button" className="btn" onClick={() => navigate(hrefs.agenda())}>
              看日程
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
