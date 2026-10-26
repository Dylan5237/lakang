import type { Session } from '../types';

export const TZ = 'Asia/Shanghai';

export const instant = (date: string, hm: string): number => Date.parse(`${date}T${hm}:00+08:00`);
export const startOf = (s: Session) => instant(s.date, s.start);
export const endOf = (s: Session) => instant(s.date, s.end);

export type Phase = 'before' | 'during' | 'between' | 'after';

export interface AgendaStatus {
  phase: Phase;
  current: Session[];
  next: Session | null;
  daysToStart?: number;
}

const sorted = (list: Session[]) => [...list].sort((a, b) => startOf(a) - startOf(b));

export function statusAt(list: Session[], now: number): AgendaStatus {
  const all = sorted(list);
  const first = startOf(all[0]);
  const last = Math.max(...all.map(endOf));
  const current = all.filter((s) => startOf(s) <= now && now < endOf(s));
  const next = all.find((s) => startOf(s) > now) ?? null;
  if (now < first) {
    const dayMs = 86_400_000;
    const todayShanghai = Date.parse(`${shanghaiDate(now)}T00:00:00+08:00`);
    const firstDay = Date.parse(`${all[0].date}T00:00:00+08:00`);
    return { phase: 'before', current: [], next, daysToStart: Math.round((firstDay - todayShanghai) / dayMs) };
  }
  if (now >= last) return { phase: 'after', current: [], next: null };
  if (current.length) return { phase: 'during', current, next };
  return { phase: 'between', current: [], next };
}

export function sessionState(s: Session, now: number): 'past' | 'live' | 'upcoming' {
  if (now >= endOf(s)) return 'past';
  if (now >= startOf(s)) return 'live';
  return 'upcoming';
}

export function shanghaiDate(now: number): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return p;
}

export function shanghaiClock(now: number): string {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
}

export const dayKeys = (list: Session[]): number[] => [...new Set(list.map((s) => s.day))].sort((a, b) => a - b);

export function defaultDay(list: Session[], now: number): number {
  const days = dayKeys(list);
  const today = shanghaiDate(now);
  const byDate = list.find((s) => s.date === today);
  if (byDate) return byDate.day;
  const sortedList = sorted(list);
  return now < startOf(sortedList[0]) ? days[0] : days[days.length - 1];
}

export function venueChanged(list: Session[], s: Session): boolean {
  const day = sorted(list.filter((x) => x.date === s.date));
  const i = day.findIndex((x) => x.id === s.id);
  return i > 0 && day[i - 1].venue !== s.venue;
}

export function weekdayLabel(date: string): string {
  const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return names[new Date(`${date}T12:00:00+08:00`).getUTCDay()];
}
