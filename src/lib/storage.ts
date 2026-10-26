export const STORAGE_KEY = 'lakang:v1';
export const NOTE_MAX = 5000;

export type Theme = 'auto' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  fontLevel: 0 | 1 | 2 | 3;
}

export interface UserState {
  version: 1;
  favorites: string[];
  read: string[];
  notes: Record<string, string>;
  position: string | null;
  settings: Settings;
}

export const defaultState = (): UserState => ({
  version: 1,
  favorites: [],
  read: [],
  notes: {},
  position: null,
  settings: { theme: 'auto', fontLevel: 0 },
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function cleanIds(v: unknown, known: Set<string>): { ids: string[]; dropped: number } {
  if (!Array.isArray(v)) return { ids: [], dropped: 0 };
  const ids: string[] = [];
  let dropped = 0;
  for (const x of v) {
    if (typeof x === 'string' && known.has(x)) {
      if (!ids.includes(x)) ids.push(x);
    } else dropped++;
  }
  return { ids, dropped };
}

function cleanNotes(v: unknown, known: Set<string>): { notes: Record<string, string>; dropped: number } {
  const notes: Record<string, string> = {};
  let dropped = 0;
  if (!isRecord(v)) return { notes, dropped };
  for (const [k, val] of Object.entries(v)) {
    if (known.has(k) && typeof val === 'string') {
      if (val.trim()) notes[k] = val.slice(0, NOTE_MAX);
    } else dropped++;
  }
  return { notes, dropped };
}

function cleanSettings(v: unknown): Settings {
  const d = defaultState().settings;
  if (!isRecord(v)) return d;
  const theme = v.theme === 'light' || v.theme === 'dark' || v.theme === 'auto' ? v.theme : d.theme;
  const fontLevel = v.fontLevel === 0 || v.fontLevel === 1 || v.fontLevel === 2 || v.fontLevel === 3 ? v.fontLevel : d.fontLevel;
  return { theme, fontLevel };
}

export function normalizeState(raw: unknown, known: Set<string>): UserState {
  const d = defaultState();
  if (!isRecord(raw)) return d;
  return {
    version: 1,
    favorites: cleanIds(raw.favorites, known).ids,
    read: cleanIds(raw.read, known).ids,
    notes: cleanNotes(raw.notes, known).notes,
    position: typeof raw.position === 'string' && known.has(raw.position) ? raw.position : null,
    settings: cleanSettings(raw.settings),
  };
}

export const EXPORT_APP = 'lakang-cards';

export function buildExport(state: UserState, now = new Date()): string {
  return JSON.stringify(
    {
      app: EXPORT_APP,
      version: 1,
      exportedAt: now.toISOString(),
      data: { favorites: state.favorites, read: state.read, notes: state.notes, position: state.position, settings: state.settings },
    },
    null,
    2,
  );
}

export interface ImportPreview {
  ok: true;
  incoming: UserState;
  counts: { favorites: number; read: number; notes: number };
  dropped: number;
}
export interface ImportError {
  ok: false;
  error: string;
}

export function parseImport(text: string, known: Set<string>): ImportPreview | ImportError {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '文件不是有效的 JSON。' };
  }
  if (!isRecord(raw) || raw.app !== EXPORT_APP) return { ok: false, error: '这不是本站导出的备份文件。' };
  if (raw.version !== 1) return { ok: false, error: `备份版本 ${String(raw.version)} 暂不支持。` };
  if (!isRecord(raw.data)) return { ok: false, error: '备份文件缺少 data。' };
  const d = raw.data;
  const fav = cleanIds(d.favorites, known);
  const read = cleanIds(d.read, known);
  const notes = cleanNotes(d.notes, known);
  const dropped = fav.dropped + read.dropped + notes.dropped;
  const incoming: UserState = {
    version: 1,
    favorites: fav.ids,
    read: read.ids,
    notes: notes.notes,
    position: typeof d.position === 'string' && known.has(d.position) ? d.position : null,
    settings: cleanSettings(d.settings),
  };
  return { ok: true, incoming, counts: { favorites: fav.ids.length, read: read.ids.length, notes: Object.keys(notes.notes).length }, dropped };
}

export function applyImport(current: UserState, incoming: UserState, mode: 'merge' | 'overwrite'): UserState {
  if (mode === 'overwrite') return { ...incoming, version: 1 };
  const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  const notes = { ...incoming.notes };
  for (const [k, v] of Object.entries(current.notes)) {
    notes[k] = notes[k] && notes[k] !== v ? `${v}\n---\n${notes[k]}`.slice(0, NOTE_MAX) : v;
  }
  return {
    version: 1,
    favorites: union(current.favorites, incoming.favorites),
    read: union(current.read, incoming.read),
    notes,
    position: current.position ?? incoming.position,
    settings: current.settings,
  };
}

export interface Backend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadState(backend: Backend | null, known: Set<string>): UserState {
  if (!backend) return defaultState();
  try {
    const text = backend.getItem(STORAGE_KEY);
    if (!text) return defaultState();
    return normalizeState(JSON.parse(text), known);
  } catch {
    return defaultState();
  }
}

export function saveState(backend: Backend | null, state: UserState): boolean {
  if (!backend) return false;
  try {
    backend.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
