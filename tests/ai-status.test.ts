import { describe, expect, it } from 'vitest';
import { getAiStatus, markAiSeen, setAiStatus } from '../src/lib/aiStatus';

describe('AI 页签状态', () => {
  it('思考/回答中保持进行态，完成后标记未读，打开后复位', () => {
    setAiStatus('idle');
    setAiStatus('thinking');
    expect(getAiStatus()).toEqual({ phase: 'thinking', unseen: false });
    setAiStatus('streaming');
    expect(getAiStatus()).toEqual({ phase: 'streaming', unseen: false });
    setAiStatus('done', true);
    expect(getAiStatus()).toEqual({ phase: 'done', unseen: true });
    markAiSeen();
    expect(getAiStatus()).toEqual({ phase: 'idle', unseen: false });
  });

  it('打开对话不会打断进行中的生成', () => {
    setAiStatus('thinking');
    markAiSeen();
    expect(getAiStatus()).toEqual({ phase: 'thinking', unseen: false });
    setAiStatus('error', true);
    markAiSeen();
    expect(getAiStatus()).toEqual({ phase: 'idle', unseen: false });
  });
});
