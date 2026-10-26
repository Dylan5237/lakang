import { useEffect, useMemo, useRef, useState } from 'react';
import { cardById } from './data';
import { STAGES } from './types';
import { applyFilters, isFiltered, noFilters, type Filters } from './lib/filter';
import { hrefs, parseHash, useHash } from './lib/router';
import { getState, useUser } from './lib/store';
import { applyUpdate, usePwa } from './lib/pwa';
import { AgendaPage } from './components/AgendaPage';
import { DetailDialog } from './components/DetailDialog';
import { Feed, stepFeed } from './components/Feed';
import { FilterSheet } from './components/FilterSheet';
import { GuidePage } from './components/GuidePage';
import { IconBook, IconCalendar, IconCards, IconDown, IconSearch, IconUp, IconUser } from './components/Icons';
import { MePage } from './components/MePage';
const FONT_SIZES = ['100%', '112.5%', '125%', '145%'];
function useApplySettings() {
  const { settings } = useUser();
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = settings.theme;
    root.style.fontSize = FONT_SIZES[settings.fontLevel];
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
    update();
    if (settings.theme === 'auto') media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [settings]);
}
export function App() {
  const route = parseHash(useHash());
  const pwa = usePwa();
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  useApplySettings();
  const filterKey = JSON.stringify(filters);
  // Intentionally recompute only for filter changes: marking a card read must not remove it mid-read.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => applyFilters(filters, getState()), [filterKey]);
  const filtered = isFiltered(filters);
  const feedCardId = route.name === 'feed' ? route.cardId : undefined;
  const listRef = useRef(list); listRef.current = list;
  useEffect(() => { if (feedCardId && cardById.has(feedCardId) && !listRef.current.some((c) => c.id === feedCardId)) setFilters(noFilters); }, [feedCardId]);
  const detailCard = route.name === 'feed' && route.detail && route.cardId ? cardById.get(route.cardId) : undefined;
  const nav = [
    { name: 'feed', label: '卡片', href: hrefs.feed(), Icon: IconCards },
    { name: 'agenda', label: '日程', href: hrefs.agenda(), Icon: IconCalendar },
    { name: 'guide', label: '专题', href: hrefs.guide(), Icon: IconBook },
    { name: 'me', label: '我的', href: hrefs.me(), Icon: IconUser },
  ] as const;
  return <div className="app">
    {pwa.needRefresh && <div className="update-bar" role="status">有新版本可用<button type="button" onClick={() => void applyUpdate()}>更新</button></div>}
    {route.name === 'feed' && <header className="topbar">
      <div className="title-row"><h1>拉康 · 随身读</h1>
        {pwa.offlineReady && <span className="pill" data-testid="offline-pill">离线已就绪</span>}
        <div className="tools">
          <button type="button" className="icon-btn" aria-label="上一张" onClick={() => stepFeed(-1)}><IconUp /></button>
          <button type="button" className="icon-btn" aria-label="下一张" onClick={() => stepFeed(1)}><IconDown /></button>
          <button type="button" className={`icon-btn ${filtered ? 'on' : ''}`} aria-label="搜索与筛选" aria-haspopup="dialog" onClick={() => setFilterOpen(true)} data-testid="open-filter"><IconSearch /></button>
        </div>
      </div>
      <div className="stage-row" role="group" aria-label="阶段">
        <a className="chip" href={hrefs.guide('series')}>专题精读</a>
        <button type="button" className={`chip ${filters.stage === 'all' ? 'on' : ''}`} aria-pressed={filters.stage === 'all'} onClick={() => setFilters({ ...filters, stage: 'all' })}>全部</button>
        {STAGES.map((s) => <button key={s.id} type="button" className={`chip ${filters.stage === s.id ? 'on' : ''}`} aria-pressed={filters.stage === s.id} onClick={() => setFilters({ ...filters, stage: s.id })}>{s.label}</button>)}
      </div>
      {!window.isSecureContext && <p className="http-note">当前为HTTP连接，暂不支持离线缓存。</p>}
      {filtered && <p className="filter-line" data-testid="filter-line">筛选后共 {list.length} 张<button type="button" onClick={() => setFilters(noFilters)}>清除</button></p>}
    </header>}
    {route.name === 'feed' && <Feed list={list} filterKey={filterKey} routeCardId={route.cardId} filtered={filtered} onClearFilters={() => setFilters(noFilters)} />}
    {route.name === 'agenda' && <AgendaPage day={route.day} sessionId={route.sessionId} />}
    {route.name === 'guide' && <GuidePage tab={route.tab} />}
    {route.name === 'me' && <MePage />}
    <nav className="bottom-nav" aria-label="主导航">{nav.map(({ name, label, href, Icon }) => <a key={name} href={href} aria-current={route.name === name ? 'page' : undefined} className={route.name === name ? 'on' : ''}><Icon /><span>{label}</span></a>)}</nav>
    <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} onChange={setFilters} />
    <DetailDialog card={detailCard} />
  </div>;
}
