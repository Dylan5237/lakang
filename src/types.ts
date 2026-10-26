export type Stage = 'question' | 'concept' | 'history' | 'speakers' | 'themes' | 'clinic';

export interface Card {
  id: string;
  stage: Stage;
  topic: string;
  title: string;
  body: string;
  takeaway: string;
  detail: string[];
  question?: string;
  action?: string;
  fictional?: boolean;
  sourceIds: string[];
  locators?: Record<string, string>;
  chapterIds: string[];
  speakerIds: string[];
  sessionIds: string[];
  relatedCardIds: string[];
  termIds?: string[];
}

export interface Source {
  id: string;
  title: string;
  url: string;
  date: string;
  publisher: string;
  editorialScope?: string;
}

export interface Talk {
  speakerId: string;
  title: string;
  original: string;
}

export interface Session {
  id: string;
  date: string;
  day: number;
  title: string;
  speaker: string;
  speakerIds: string[];
  start: string;
  end: string;
  venue: string;
  note: string;
  original: string;
  talks?: Talk[];
  sourcePages: number[];
}

export interface Speaker {
  id: string;
  name: string;
  original: string;
  thread: string;
  intro: string;
  cardId: string;
}
export interface Term {
  id: string;
  zh: string;
  original: string;
  text: string;
  sourceIds: string[];
  chapterIds: string[];
}
export interface Book {
  id: string;
  title: string;
  how: string;
  sourceIds: string[];
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: 'question', label: '问题' },
  { id: 'concept', label: '概念' },
  { id: 'history', label: '广州脉络' },
  { id: 'speakers', label: '讲者' },
  { id: 'themes', label: '议题' },
  { id: 'clinic', label: '临床' },
];
