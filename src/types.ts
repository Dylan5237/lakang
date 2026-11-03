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

/* 公开学习层（随站点发布，来自 content/） */
export interface StudySource { id: string; title: string; url: string; date: string; publisher: string }
export interface StudyCard {
  id: string; stage: string; stageLabel: string; topic: string; title: string; body: string; takeaway: string;
  detail: string[]; question: string | null; action: string | null; termIds: string[];
  sourceIds: string[]; locators: Record<string, string>; relatedCardIds: string[];
}
export interface CaseLink { case: string; section: string; note: string }
export interface Term { id: string; zh: string; original: string; brief: string; detail?: string; sourceIds: string[]; related?: string[]; caseLinks?: CaseLink[] }
