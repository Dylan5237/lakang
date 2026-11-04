import { describe, expect, it } from 'vitest';
import { streakOf } from '../src/lib/habit';

describe('streakOf', () => {
  it('counts consecutive days ending today', () => expect(streakOf(['2026-11-02', '2026-11-03', '2026-11-04'], '2026-11-04')).toBe(3));
  it('keeps the streak alive until today is missed', () => expect(streakOf(['2026-11-02', '2026-11-03'], '2026-11-04')).toBe(2));
  it('breaks on a gap', () => expect(streakOf(['2026-11-01', '2026-11-03'], '2026-11-04')).toBe(1));
  it('is zero when nothing recent', () => expect(streakOf(['2026-10-01'], '2026-11-04')).toBe(0));
});
