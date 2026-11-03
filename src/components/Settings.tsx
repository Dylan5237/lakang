import { useEffect, useState } from 'react';
import { FONT_LABELS, THEMES, applySettings, readSettings, writeSettings, type Settings } from '../lib/settings';
import { Sheet } from './Sheet';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(readSettings);
  useEffect(() => { if (open) setS(readSettings()); }, [open]);
  const put = (patch: Partial<Settings>) => { const n = { ...s, ...patch }; setS(n); writeSettings(n); applySettings(n); };
  return <>
    <button type="button" className="tool icon" aria-label="显示设置" onClick={() => setOpen(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.4 5.4l1.8 1.8M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8" /></svg>
    </button>
    <Sheet open={open} title="显示设置" onClose={() => setOpen(false)} testId="settings">
      <section className="set-group"><h3>主题</h3>
        <div className="seg-row">{THEMES.map((t) => <button key={t.id} type="button" className={`seg ${s.theme === t.id ? 'on' : ''}`} aria-pressed={s.theme === t.id} onClick={() => put({ theme: t.id })}>{t.label}</button>)}</div>
      </section>
      <section className="set-group"><h3>字号</h3>
        <div className="seg-row">{FONT_LABELS.map((label, i) => <button key={label} type="button" className={`seg ${s.fontLevel === i ? 'on' : ''}`} aria-pressed={s.fontLevel === i} onClick={() => put({ fontLevel: i })}>{label}</button>)}</div>
      </section>
      <p className="hint">设置只保存在这台设备的浏览器里。</p>
    </Sheet>
  </>;
}
