export type AiPhase = 'idle' | 'thinking' | 'streaming' | 'done' | 'error';

export interface AiStatus { phase: AiPhase; unseen: boolean }

let status: AiStatus = { phase: 'idle', unseen: false };
const listeners = new Set<() => void>();

export const subscribeAiStatus = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
export const getAiStatus = () => status;

export function setAiStatus(phase: AiPhase, unseen = false) {
  status = { phase, unseen };
  listeners.forEach((cb) => cb());
}

/** Opening the dialog acknowledges a finished/error state; an in-flight request keeps its phase. */
export function markAiSeen() {
  if (status.phase === 'done' || status.phase === 'error' || status.unseen) setAiStatus('idle', false);
}
