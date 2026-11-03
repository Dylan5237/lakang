import { describe, expect, it } from 'vitest';
import { conferenceCards, studyCards } from '../src/data';
import { learningSteps } from '../src/components/HomePage';
import { hrefs, parseHash } from '../src/lib/router';

describe('学习站框架', () => {
  it('学习路径四步不重不漏地覆盖全部学习卡，不含大会归档卡', () => {
    const ids = learningSteps.flatMap((s) => s.cardIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(studyCards.map((c) => c.id).sort());
    expect(learningSteps.every((s) => s.cardIds.length > 0)).toBe(true);
    const archived = new Set(conferenceCards.map((c) => c.id));
    expect(ids.some((id) => archived.has(id))).toBe(false);
  });

  it('首页、卡片流、术语、归档有独立路由；旧链接仍可解析', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash(hrefs.home())).toEqual({ name: 'home' });
    expect(parseHash(hrefs.feed())).toEqual({ name: 'feed' });
    expect(parseHash(hrefs.terms())).toEqual({ name: 'terms' });
    expect(parseHash(hrefs.archive())).toEqual({ name: 'archive' });
    expect(parseHash(hrefs.clinical())).toEqual({ name: 'clinical' });
    expect(parseHash('#/card/K010/more')).toEqual({ name: 'feed', cardId: 'K010', detail: true });
    expect(parseHash('#/guide/terms')).toEqual({ name: 'terms' });
    expect(parseHash('#/guide/speakers')).toEqual({ name: 'archive' });
    expect(parseHash('#/agenda/28')).toEqual({ name: 'agenda', day: '28', sessionId: undefined });
    expect(parseHash('#/previews/P01')).toMatchObject({ name: 'previews', articleId: 'P01' });
  });
});
