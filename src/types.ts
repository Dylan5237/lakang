export type Role = 'analyst' | 'patient' | 'supervisor' | 'doctor' | 'note';

export interface Turn { role: Role; who: string; text: string }
export interface Section { id: string; title: string; time: string; part: 'interview' | 'discussion'; turns: Turn[] }
/** html is whitelisted to <b>, <br>, <ul>, <li> by scripts/build_clinical.py */
export interface NoteCard { tag: string; quote: boolean; html: string; who?: string; refs?: string[] }
/** record: facts from the session; said: what a named participant said; editor: notes added later; glossary: concept background */
export type NoteLayer = 'record' | 'said' | 'editor' | 'glossary';
export interface NoteGroup { title: string; cards: NoteCard[]; layer?: NoteLayer; intro?: string }
export interface LegendItem { role: Role; text: string }
export interface Case {
  id: string; date: string; label: string; legend: LegendItem[];
  discussionLabel: string | null; sections: Section[]; groups: NoteGroup[];
}
export interface Archive { title: string; notice: string[]; cases: Case[] }

export const ROLES: { id: Role; label: string }[] = [
  { id: 'analyst', label: '分析师' }, { id: 'patient', label: '来访者' }, { id: 'supervisor', label: '督导' },
  { id: 'doctor', label: '医生' }, { id: 'note', label: '说明' },
];
