/** Personal study notes keyed by section id. Local only: never uploaded, never in any site backup. */
const KEY = 'lakang:notes';
export const NOTE_MAX = 4000;

export function readNotes(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

export function saveNote(sectionId: string, text: string): void {
  const notes = readNotes();
  const t = text.trim();
  if (t) notes[sectionId] = t.slice(0, NOTE_MAX); else delete notes[sectionId];
  try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch { /* storage blocked */ }
}

export function exportNotes(): number {
  const notes = readNotes();
  const count = Object.keys(notes).length;
  if (!count) return 0;
  const url = URL.createObjectURL(new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = `lakang-notes-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return count;
}
