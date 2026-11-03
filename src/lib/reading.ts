import type { Section } from '../types';

/** Only ids are stored locally; no record text ever leaves memory. */
const POS = 'lakang:position';
export function readPositions(): Record<string, string> {
  try { const v = JSON.parse(localStorage.getItem(POS) ?? '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function savePosition(caseId: string, sectionId: string): void {
  try { localStorage.setItem(POS, JSON.stringify({ ...readPositions(), [caseId]: sectionId })); } catch { /* storage blocked */ }
}

const norm = (s: string) => s.normalize('NFKC').toLowerCase();

export interface Hit { sectionId: string; index: number }

/** Turns matching every whitespace-separated token, in reading order. */
export function findHits(sections: Section[], query: string): Hit[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const hits: Hit[] = [];
  for (const s of sections) s.turns.forEach((t, index) => {
    const text = norm(t.text);
    if (tokens.every((k) => text.includes(k))) hits.push({ sectionId: s.id, index });
  });
  return hits;
}

/** Split text into plain/match segments for highlighting. */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const tokens = [...new Set(norm(query).split(/\s+/).filter(Boolean))];
  if (!tokens.length) return [{ text, match: false }];
  const low = norm(text);
  // NFKC can change length for some characters; fall back to no highlight rather than misalign.
  if (low.length !== text.length) return [{ text, match: false }];
  const mark = new Array<boolean>(text.length).fill(false);
  for (const t of tokens) for (let i = low.indexOf(t); i >= 0; i = low.indexOf(t, i + 1)) mark.fill(true, i, i + t.length);
  const out: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1];
    if (last && last.match === mark[i]) last.text += text[i]; else out.push({ text: text[i], match: mark[i] });
  }
  return out;
}
