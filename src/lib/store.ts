import { useSyncExternalStore } from 'react';
import { cards } from '../data';
import { applyImport, defaultState, loadState, saveState, type Backend, type Settings, type UserState } from './storage';

const known = new Set(cards.map((c) => c.id));

function backend(): Backend | null {
  try {
    const b = window.localStorage;
    b.getItem('lakang:probe');
    return b;
  } catch {
    return null;
  }
}

const be = backend();
let state: UserState = loadState(be, known);
let persistent = be !== null;
const listeners = new Set<() => void>();

function commit(next: UserState) {
  state = next;
  if (be) persistent = saveState(be, state);
  listeners.forEach((l) => l());
}

export const getState = () => state;
export const isPersistent = () => persistent;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useUser(): UserState {
  return useSyncExternalStore(subscribe, getState, getState);
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const actions = {
  toggleFavorite: (id: string) => commit({ ...state, favorites: toggleIn(state.favorites, id) }),
  toggleRead: (id: string) => commit({ ...state, read: toggleIn(state.read, id) }),
  setNote: (id: string, text: string) => {
    const notes = { ...state.notes };
    if (text.trim()) notes[id] = text;
    else delete notes[id];
    commit({ ...state, notes });
  },
  setPosition: (id: string | null) => {
    if (state.position !== id) commit({ ...state, position: id });
  },
  setSettings: (patch: Partial<Settings>) => commit({ ...state, settings: { ...state.settings, ...patch } }),
  importState: (incoming: UserState, mode: 'merge' | 'overwrite') => commit(applyImport(state, incoming, mode)),
  clearAll: () => commit(defaultState()),
};

export const knownCardIds = known;
