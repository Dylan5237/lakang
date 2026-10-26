import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface Props {
  open: boolean;
  title: string;
  onRequestClose: () => void;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function Sheet({ open, title, onRequestClose, children, className = '', testId }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
      const el = opener.current;
      opener.current = null;
      if (el && document.contains(el)) el.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-label={title}
      data-testid={testId}
      onCancel={(e) => {
        e.preventDefault();
        if (openRef.current) onRequestClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && openRef.current) onRequestClose();
      }}
    >
      {open && (
        <div className="sheet-body">
          <div className="sheet-head">
            <h2>{title}</h2>
            <button type="button" className="icon-btn" aria-label="关闭" onClick={onRequestClose}>
              <IconClose />
            </button>
          </div>
          <div className="sheet-scroll">{children}</div>
        </div>
      )}
    </dialog>
  );
}
