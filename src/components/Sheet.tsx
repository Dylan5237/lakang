import { useEffect, useRef } from 'react';

/** Bottom sheet on a native <dialog>: Esc, backdrop tap and back gesture all close it. */
export function Sheet({ open, title, onClose, testId, children }: { open: boolean; title: string; onClose: () => void; testId?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal(); else if (!open && d.open) d.close();
  }, [open]);
  return <dialog ref={ref} className="sheet" aria-label={title} data-testid={testId} onClose={onClose}
    onClick={(e) => { if (e.target === ref.current) onClose(); }}>
    <div className="sheet-body">
      <header className="sheet-head"><h2>{title}</h2><button type="button" className="ghost" onClick={onClose}>关闭</button></header>
      {open && children}
    </div>
  </dialog>;
}
