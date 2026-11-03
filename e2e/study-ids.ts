import { readFileSync, readdirSync } from 'node:fs';
// Mirrors isConferenceCard in src/data.ts: study feed = reading order minus conference-archive cards.
const dir = new URL('../content/cards/', import.meta.url);
const all = readdirSync(dir).flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as { id: string; stage: string; topic: string }[]);
const byId = new Map(all.map((c) => [c.id, c]));
const topics = new Set(['大会主线', '广州脉络', '讲题对读', '观察工具']);
const readingOrder = JSON.parse(readFileSync(new URL('../content/reading-order.json', import.meta.url), 'utf8')) as string[];
export const isConference = (id: string) => { const c = byId.get(id)!; return c.stage === 'official' || c.stage === 'speakers' || topics.has(c.topic) || id === 'K039'; };
export const studyOrder = readingOrder.filter((id) => !isConference(id));
export const stageIds = (stage: string) => studyOrder.filter((id) => byId.get(id)!.stage === stage);
