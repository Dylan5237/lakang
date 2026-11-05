import { useId, useState } from 'react';

/** Disclosure with a Grid 0fr→1fr transition; no height measuring, content stays mounted but inert. */
export function Fold({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className="fold" data-testid={testId}>
    <button type="button" className="fold-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
      <span>{open ? '收起' : label}</span><span className="fold-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    <div className={`fold-grid ${open ? 'open' : ''}`} id={id} inert={!open}>
      <div className="fold-inner">{children}</div>
    </div>
  </div>;
}
