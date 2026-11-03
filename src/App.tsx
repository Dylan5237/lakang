import { useEffect, useMemo, useRef, useState } from 'react';
import { cardById, retiredCardIds, studyCardIds } from './data';
import { STUDY_STAGES } from './types';
import { applyFilters, isFiltered, noFilters, type Filters } from './lib/filter';
import { hrefs, navigate, parseHash, useHash } from './lib/router';
import { getState, useUser } from './lib/store';
import { applyUpdate, usePwa } from './lib/pwa';
import { AgendaPage } from './components/AgendaPage';
import { DetailDialog } from './components/DetailDialog';
import { Feed, stepFeed } from './components/Feed';
import { FilterSheet } from './components/FilterSheet';
import { GuidePage } from './components/GuidePage';
import { HomePage } from './components/HomePage';
import { TermsPage } from './components/TermsPage';
import { ArchivePage } from './components/ArchivePage';
import { ClinicalPage } from './components/ClinicalPage';
import { PreviewsPage } from './components/PreviewsPage';
import { IconBook, IconCards, IconDown, IconHome, IconLock, IconNote, IconSearch, IconUp, IconUser } from './components/Icons';
import { MePage } from './components/MePage';
import './official.css';
const FONT_SIZES = ['100%', '112.5%', '125%', '145%'];
function useApplySettings() {
  const { settings } = useUser();
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = settings.theme;
    root.style.fontSize = FONT_SIZES[settings.fontLevel];
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
    update(); if (settings.theme === 'auto') media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [settings]);
}
export function App() {
  const route = parseHash(useHash()); const pwa = usePwa();
  const [filters, setFilters] = useState<Filters>(noFilters); const [filterOpen, setFilterOpen] = useState(false);
  useApplySettings();
  const filterKey = JSON.stringify(filters);
  // Recompute for filter changes only, not when the current card is marked read.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const baseList = useMemo(() => applyFilters(filters, getState()), [filterKey]);
  const feedCardId = route.name === 'feed' ? route.cardId : undefined;
  // Appendix and conference-archive cards open on their own, outside the study feed.
  const archiveCard = feedCardId && !studyCardIds.has(feedCardId) && !baseList.some((c) => c.id === feedCardId) ? cardById.get(feedCardId) : undefined;
  const list = useMemo(() => archiveCard ? [archiveCard] : baseList, [baseList, archiveCard]);
  const filtered = isFiltered(filters) || Boolean(archiveCard);
  const listRef = useRef(baseList); listRef.current = baseList;
  useEffect(() => { if (feedCardId && studyCardIds.has(feedCardId) && !listRef.current.some((c) => c.id === feedCardId)) setFilters(noFilters); }, [feedCardId]);
  const clear = () => { setFilters(noFilters); if (feedCardId && !studyCardIds.has(feedCardId)) navigate(hrefs.feed()); };
  const detailCard = route.name === 'feed' && route.detail && route.cardId ? cardById.get(route.cardId) : undefined;
  const nav = [
    { name: 'home', label: '学习', href: hrefs.home(), Icon: IconHome },
    { name: 'feed', label: '卡片', href: hrefs.feed(), Icon: IconCards },
    { name: 'guide', label: '专题', href: hrefs.guide(), Icon: IconBook },
    { name: 'terms', label: '术语', href: hrefs.terms(), Icon: IconNote },
    { name: 'clinical', label: '临床', href: hrefs.clinical(), Icon: IconLock },
    { name: 'me', label: '我的', href: hrefs.me(), Icon: IconUser },
  ] as const;
  // Archive pages (agenda, previews) belong under the home tab.
  const tab = route.name === 'archive' || route.name === 'agenda' || route.name === 'previews' ? 'home' : route.name;
  return <div className="app">
    {pwa.needRefresh && <div className="update-bar" role="status">有新版本可用<button type="button" onClick={() => void applyUpdate()}>更新</button></div>}
    {route.name === 'feed' && <header className="topbar">
      <div className="title-row"><h1>拉康随身读</h1>{pwa.offlineReady && <span className="pill" data-testid="offline-pill">离线已就绪</span>}
        <div className="tools"><button type="button" className="icon-btn" aria-label="上一张" onClick={() => stepFeed(-1)}><IconUp /></button><button type="button" className="icon-btn" aria-label="下一张" onClick={() => stepFeed(1)}><IconDown /></button><button type="button" className={`icon-btn ${filtered ? 'on' : ''}`} aria-label="搜索与筛选" aria-haspopup="dialog" onClick={() => setFilterOpen(true)} data-testid="open-filter"><IconSearch /></button></div>
      </div>
      <div className="stage-row" role="group" aria-label="阶段"><button type="button" className={`chip ${filters.stage === 'all' ? 'on' : ''}`} aria-pressed={filters.stage === 'all'} onClick={() => setFilters({ ...filters, stage: 'all' })}>全部</button>{STUDY_STAGES.map((s) => <button key={s.id} type="button" className={`chip ${filters.stage === s.id ? 'on' : ''}`} aria-pressed={filters.stage === s.id} onClick={() => setFilters({ ...filters, stage: s.id })}>{s.label}</button>)}</div>
      {!window.isSecureContext && <p className="http-note">当前为HTTP连接，暂不支持离线缓存。</p>}
      {filtered && <p className="filter-line" data-testid="filter-line">{archiveCard ? (retiredCardIds.has(archiveCard.id) ? '附录卡片 · 不计入学习进度' : '会议归档卡片 · 不计入学习进度') : `筛选后共 ${list.length} 张`}<button type="button" onClick={clear}>{archiveCard ? '返回卡片流' : '清除'}</button></p>}
    </header>}
    {route.name === 'feed' && <Feed list={list} filterKey={filterKey + (archiveCard ? `:archive:${archiveCard.id}` : '')} routeCardId={route.cardId} filtered={filtered} onClearFilters={clear} />}
    {route.name === 'home' && <HomePage offlineReady={pwa.offlineReady} />}{route.name === 'terms' && <TermsPage />}{route.name === 'archive' && <ArchivePage />}{route.name === 'clinical' && <ClinicalPage />}
    {route.name === 'previews' && <PreviewsPage articleId={route.articleId} original={route.original} paragraphId={route.paragraphId} />}
    {route.name === 'agenda' && <AgendaPage day={route.day} sessionId={route.sessionId} />}{route.name === 'guide' && <GuidePage tab={route.tab} />}{route.name === 'me' && <MePage />}
    <nav className="bottom-nav" aria-label="主导航">{nav.map(({ name, label, href, Icon }) => <a key={name} href={href} aria-current={tab === name ? 'page' : undefined} className={tab === name ? 'on' : ''}><Icon /><span>{label}</span></a>)}</nav>
    <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} onChange={setFilters} /><DetailDialog card={detailCard} />
  </div>;
}
