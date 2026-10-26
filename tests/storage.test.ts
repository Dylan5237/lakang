import { describe, expect, it } from 'vitest';
import { applyImport, buildExport, defaultState, loadState, normalizeState, parseImport, saveState, STORAGE_KEY, NOTE_MAX, type Backend } from '../src/lib/storage';

const known = new Set(['K001', 'K002', 'K003']);

const memory = (init: Record<string, string> = {}): Backend & { data: Record<string, string> } => {
  const data = { ...init };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
};

describe('本地数据', () => {
  it('导出后可无损导入', () => {
    const s = { ...defaultState(), favorites: ['K001'], read: ['K002'], notes: { K003: '我的笔记' }, position: 'K002' };
    const r = parseImport(buildExport(s), known);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.incoming).toEqual(s);
      expect(r.counts).toEqual({ favorites: 1, read: 1, notes: 1 });
      expect(r.dropped).toBe(0);
    }
  });

  it('拒绝非法文件', () => {
    expect(parseImport('not json', known)).toMatchObject({ ok: false });
    expect(parseImport('{"app":"other","version":1,"data":{}}', known)).toMatchObject({ ok: false });
    expect(parseImport('{"app":"lakang-cards","version":9,"data":{}}', known)).toMatchObject({ ok: false });
    expect(parseImport('{"app":"lakang-cards","version":1}', known)).toMatchObject({ ok: false });
    expect(parseImport('[]', known)).toMatchObject({ ok: false });
  });

  it('丢弃未知 ID 与类型错误，并截断过长笔记', () => {
    const text = JSON.stringify({
      app: 'lakang-cards',
      version: 1,
      data: {
        favorites: ['K001', 'K999', 7, 'K001'],
        read: 'oops',
        notes: { K002: 'x'.repeat(NOTE_MAX + 50), K404: 'gone', K003: 12, K001: '   ' },
        position: 'K404',
        settings: { theme: 'neon', fontLevel: 9 },
      },
    });
    const r = parseImport(text, known);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.incoming.favorites).toEqual(['K001']);
      expect(r.incoming.read).toEqual([]);
      expect(Object.keys(r.incoming.notes)).toEqual(['K002']);
      expect(r.incoming.notes.K002).toHaveLength(NOTE_MAX);
      expect(r.incoming.position).toBeNull();
      expect(r.incoming.settings).toEqual({ theme: 'auto', fontLevel: 0 });
      expect(r.dropped).toBe(4);
    }
  });

  it('合并取并集并保留双方笔记；覆盖则以导入为准', () => {
    const cur = { ...defaultState(), favorites: ['K001'], notes: { K001: '本机' }, position: 'K001' };
    const inc = { ...defaultState(), favorites: ['K002'], notes: { K001: '备份', K002: '新' }, position: 'K003' };
    const merged = applyImport(cur, inc, 'merge');
    expect(merged.favorites.sort()).toEqual(['K001', 'K002']);
    expect(merged.notes.K001).toContain('本机');
    expect(merged.notes.K001).toContain('备份');
    expect(merged.notes.K002).toBe('新');
    expect(merged.position).toBe('K001');
    const over = applyImport(cur, inc, 'overwrite');
    expect(over.favorites).toEqual(['K002']);
    expect(over.notes.K001).toBe('备份');
  });

  it('存取：版本字段、损坏数据回落默认值、存储不可用不抛错', () => {
    const b = memory();
    expect(saveState(b, { ...defaultState(), favorites: ['K001'] })).toBe(true);
    expect(JSON.parse(b.data[STORAGE_KEY]).version).toBe(1);
    expect(loadState(b, known).favorites).toEqual(['K001']);
    expect(loadState(memory({ [STORAGE_KEY]: '{broken' }), known)).toEqual(defaultState());
    expect(loadState(null, known)).toEqual(defaultState());
    const failing: Backend = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
    expect(saveState(failing, defaultState())).toBe(false);
    expect(normalizeState(null, known)).toEqual(defaultState());
  });
});
