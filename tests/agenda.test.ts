import { describe, expect, it } from 'vitest';
import { sessions } from '../src/data';
import { defaultDay, instant, sessionState, shanghaiClock, shanghaiDate, statusAt, venueChanged } from '../src/lib/agenda';

const at = (s: string) => Date.parse(s);
const byId = (id: string) => sessions.find((s) => s.id === id)!;

describe('日程状态（Asia/Shanghai）', () => {
  it('会前：下一场为 27 日晚间演讲，并给出距开始天数', () => {
    const st = statusAt(sessions, at('2026-10-26T12:00:00+08:00'));
    expect(st.phase).toBe('before');
    expect(st.next?.id).toBe('d27-evening');
    expect(st.daysToStart).toBe(1);
    expect(st.current).toHaveLength(0);
  });

  it('与设备时区无关：同一时刻的不同写法得到相同状态', () => {
    const a = statusAt(sessions, at('2026-10-27T19:30:00+08:00'));
    const b = statusAt(sessions, at('2026-10-27T11:30:00Z'));
    const c = statusAt(sessions, at('2026-10-27T06:30:00-05:00'));
    for (const st of [a, b, c]) {
      expect(st.phase).toBe('during');
      expect(st.current.map((s) => s.id)).toEqual(['d27-evening']);
    }
    // 海外设备上当地日期仍是 26 日，但上海已是 27 日
    expect(shanghaiDate(at('2026-10-26T20:00:00Z'))).toBe('2026-10-27');
    expect(shanghaiClock(at('2026-10-27T11:30:00Z'))).toBe('19:30');
  });

  it('10/28 上午：开幕与演讲之间为 between，演讲时段内两讲共用', () => {
    expect(statusAt(sessions, at('2026-10-28T09:27:00+08:00'))).toMatchObject({ phase: 'between', next: { id: 'd28-keynotes' } });
    const live = statusAt(sessions, at('2026-10-28T10:45:00+08:00'));
    expect(live.phase).toBe('during');
    expect(live.current.map((s) => s.id)).toEqual(['d28-keynotes']);
    expect(byId('d28-keynotes').talks).toHaveLength(2);
    expect(byId('d28-keynotes').start).toBe('09:30');
    expect(byId('d28-keynotes').end).toBe('12:00');
  });

  it('10/29：上午 Rx104，下午与晚间换到会议楼Ⅱ 401', () => {
    expect(byId('d29-adolescent').venue).toContain('Rx104');
    for (const id of ['d29-writing', 'd29-clinical', 'd29-rhythm']) expect(byId(id).venue).toContain('401');
    expect(venueChanged(sessions, byId('d29-writing'))).toBe(true);
    expect(venueChanged(sessions, byId('d29-clinical'))).toBe(false);
    expect(venueChanged(sessions, byId('d29-adolescent'))).toBe(false);
    // 10/28 上午在冼为坚国际会议中心，下午换到 Rx104
    expect(venueChanged(sessions, byId('d28-somatic'))).toBe(true);
    const during = statusAt(sessions, at('2026-10-29T14:30:00+08:00'));
    expect(during.current[0].id).toBe('d29-writing');
    expect(during.current[0].venue).toContain('401');
  });

  it('10/29 中午：between，下一场为下午的书写与身体', () => {
    const st = statusAt(sessions, at('2026-10-29T13:00:00+08:00'));
    expect(st.phase).toBe('between');
    expect(st.next?.id).toBe('d29-writing');
  });

  it('10/31 18:00 起为会后', () => {
    expect(statusAt(sessions, at('2026-10-31T17:59:00+08:00')).phase).toBe('during');
    const after = statusAt(sessions, at('2026-10-31T18:00:00+08:00'));
    expect(after.phase).toBe('after');
    expect(after.next).toBeNull();
    expect(statusAt(sessions, at('2026-11-02T08:00:00+08:00')).phase).toBe('after');
  });

  it('场次状态与默认日期', () => {
    const s = byId('d28-somatic');
    expect(sessionState(s, instant('2026-10-28', '13:59'))).toBe('upcoming');
    expect(sessionState(s, instant('2026-10-28', '14:00'))).toBe('live');
    expect(sessionState(s, instant('2026-10-28', '15:00'))).toBe('past');
    expect(defaultDay(sessions, at('2026-10-20T00:00:00+08:00'))).toBe(27);
    expect(defaultDay(sessions, at('2026-10-29T08:00:00+08:00'))).toBe(29);
    expect(defaultDay(sessions, at('2026-11-05T08:00:00+08:00'))).toBe(31);
  });
});
