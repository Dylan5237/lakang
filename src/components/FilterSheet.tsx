import { useMemo } from 'react';
import { speakers, cards } from '../data';
import { STAGES } from '../types';
import { allTopics, applyFilters, isFiltered, noFilters, type Filters } from '../lib/filter';
import { searchCards, snippet } from '../lib/search';
import { hrefs, navigate } from '../lib/router';
import { useUser } from '../lib/store';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
}

const topics = allTopics();

export function FilterSheet({ open, onClose, filters, onChange }: Props) {
  const user = useUser();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const matched = useMemo(() => applyFilters(filters, user), [filters, user]);
  const hits = useMemo(() => (filters.query.trim() ? searchCards(filters.query) : []), [filters.query]);

  return (
    <Sheet open={open} title="搜索与筛选" onRequestClose={onClose} testId="filter-sheet">
      <div className="filter-body">
        <label className="field">
          <span>全文搜索</span>
          <input
            type="search"
            value={filters.query}
            placeholder="词、讲者、术语或卡片编号"
            onChange={(e) => set({ query: e.target.value })}
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>

        {filters.query.trim() !== '' && (
          <section aria-live="polite">
            <h3>命中 {hits.length} 张</h3>
            <ul className="hit-list">
              {hits.slice(0, 20).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(noFilters);
                      onClose();
                      navigate(hrefs.card(c.id));
                    }}
                  >
                    <strong>{c.title}</strong>
                    <span className="muted">{snippet(c, filters.query)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {hits.length > 20 && <p className="hint">仅列出前 20 张；可用下方按钮在卡片流中查看全部命中。</p>}
          </section>
        )}

        <section>
          <h3>阶段</h3>
          <div className="chip-row">
            <button type="button" className={`chip ${filters.stage === 'all' ? 'on' : ''}`} aria-pressed={filters.stage === 'all'} onClick={() => set({ stage: 'all' })}>
              全部
            </button>
            {STAGES.map((s) => (
              <button key={s.id} type="button" className={`chip ${filters.stage === s.id ? 'on' : ''}`} aria-pressed={filters.stage === s.id} onClick={() => set({ stage: s.id })}>
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>主题</h3>
          <div className="chip-row">
            {topics.map((t) => (
              <button key={t} type="button" className={`chip ${filters.topic === t ? 'on' : ''}`} aria-pressed={filters.topic === t} onClick={() => set({ topic: filters.topic === t ? null : t })}>
                {t}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>讲者</h3>
          <div className="chip-row">
            {speakers.map((s) => (
              <button key={s.id} type="button" className={`chip ${filters.speakerId === s.id ? 'on' : ''}`} aria-pressed={filters.speakerId === s.id} onClick={() => set({ speakerId: filters.speakerId === s.id ? null : s.id })}>
                {s.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>状态</h3>
          <div className="chip-row">
            <button type="button" className={`chip ${filters.favOnly ? 'on' : ''}`} aria-pressed={filters.favOnly} onClick={() => set({ favOnly: !filters.favOnly })}>
              仅看收藏（{user.favorites.length}）
            </button>
            <button type="button" className={`chip ${filters.unreadOnly ? 'on' : ''}`} aria-pressed={filters.unreadOnly} onClick={() => set({ unreadOnly: !filters.unreadOnly })}>
              仅看未读（{cards.length - user.read.length}）
            </button>
          </div>
        </section>

        <div className="sheet-foot">
          <button type="button" className="btn" disabled={!isFiltered(filters)} onClick={() => onChange(noFilters)}>
            清除全部
          </button>
          <button type="button" className="btn primary" onClick={onClose} data-testid="apply-filters">
            在卡片流中查看 {matched.length} 张
          </button>
        </div>
      </div>
    </Sheet>
  );
}
