import { useRef, useState } from 'react';
import { activeCardIds, cardById, cards, retiredCardIds } from '../data';
import { buildExport, parseImport, type ImportPreview, type Settings } from '../lib/storage';
import { hrefs, navigate } from '../lib/router';
import { actions, isPersistent, knownCardIds, useUser } from '../lib/store';
import { applyUpdate, usePwa } from '../lib/pwa';
import { Sheet } from './Sheet';
const FONT_LABELS = ['标准', '偏大', '大', '特大'];
const THEMES: { id: Settings['theme']; label: string }[] = [{ id: 'auto', label: '跟随系统' }, { id: 'light', label: '浅色' }, { id: 'dark', label: '深色' }];
export function MePage() {
  const user = useUser(); const pwa = usePwa(); const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const noteIds = Object.keys(user.notes).filter((id) => cardById.has(id));
  const activeRead = user.read.filter((id) => activeCardIds.has(id)).length;
  const archiveRead = user.read.filter((id) => retiredCardIds.has(id)).length;
  const doExport = () => {
    const url = URL.createObjectURL(new Blob([buildExport(user)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `lakang-cards-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ kind: 'ok', text: '已导出。文件含你的笔记，请自行保管，不要上传到公共位置。' });
  };
  const onFile = async (file: File | undefined) => {
    if (!file) return; setMessage(null);
    if (file.size > 2_000_000) { setMessage({ kind: 'err', text: '文件过大，不是本站的备份。' }); return; }
    try {
      const result = parseImport(await file.text(), knownCardIds);
      if (!result.ok) setMessage({ kind: 'err', text: result.error }); else setPreview(result);
    } catch { setMessage({ kind: 'err', text: '文件无法读取，请重新选择本站备份。' }); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const offlineText = !window.isSecureContext ? '当前为HTTP连接，浏览器不能启用离线缓存。切换到HTTPS地址后首次联网加载，才可准备离线阅读。' : pwa.offlineReady ? '离线已就绪：断网后仍可阅读卡片、官方前瞻文字原文、专题与日程。' : '离线缓存尚未就绪。请保持联网，确认浏览器允许本站缓存。';
  return <main className="page me" data-testid="me">
    <header className="page-head"><h1>我的</h1><p className="muted">收藏、已读、笔记和阅读位置只保存在这台设备的浏览器里，不上传。</p></header>
    <section className="panel"><h2>阅读进度</h2><p>已读 {activeRead} / {cards.length} 张 · 收藏 {user.favorites.length} 张 · 笔记 {noteIds.length} 条</p><progress max={cards.length} value={activeRead} aria-label="已读进度" /><p className="hint">另保留附录已读 {archiveRead} 张，不计入主卡流进度。</p><a className="btn-link" href={hrefs.previews('appendix')}>附录与会场工具</a>{!isPersistent() && <p className="warn">当前浏览器禁止本地存储（可能是隐私模式），本次关闭后数据会丢失。请先导出备份。</p>}</section>
    <section className="panel" data-testid="offline-panel"><h2>离线阅读</h2><p data-testid="offline-state">{offlineText}</p>{pwa.needRefresh && <p>有新版本。 <button type="button" className="btn" onClick={() => void applyUpdate()}>更新并重新载入</button></p>}<p className="hint">从HTTP换到HTTPS或更换域名，浏览器会使用另一份本地数据。请先在原地址导出备份，再到新地址导入。</p></section>
    <section className="panel"><h2>显示</h2><fieldset><legend>主题</legend><div className="chip-row">{THEMES.map((t) => <button key={t.id} type="button" className={`chip ${user.settings.theme === t.id ? 'on' : ''}`} aria-pressed={user.settings.theme === t.id} onClick={() => actions.setSettings({ theme: t.id })}>{t.label}</button>)}</div></fieldset><fieldset><legend>字号</legend><div className="chip-row">{FONT_LABELS.map((l, i) => <button key={l} type="button" className={`chip ${user.settings.fontLevel === i ? 'on' : ''}`} aria-pressed={user.settings.fontLevel === i} onClick={() => actions.setSettings({ fontLevel: i as Settings['fontLevel'] })}>{l}</button>)}</div></fieldset><p className="hint">动画会跟随系统的“减少动态效果”设置。</p></section>
    <section className="panel"><h2>我的笔记</h2>{noteIds.length === 0 ? <p className="muted">还没有笔记。在卡片的“展开读”里可以写。</p> : <ul className="link-list">{noteIds.map((id) => <li key={id}><a href={hrefs.detail(id)} onClick={(e) => { e.preventDefault(); navigate(hrefs.detail(id)); }}>{cardById.get(id)?.title}{retiredCardIds.has(id) ? '（附录）' : ''}</a><div className="muted clamp">{user.notes[id]}</div></li>)}</ul>}</section>
    <section className="panel"><h2>备份与清除</h2><div className="btn-row"><button type="button" className="btn" onClick={doExport}>导出备份</button><button type="button" className="btn" onClick={() => fileRef.current?.click()}>导入备份</button><button type="button" className="btn danger" onClick={() => setConfirmClear(true)}>清除本地数据</button></div><input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="import-file" onChange={(e) => void onFile(e.target.files?.[0])} />{message && <p role="status" className={message.kind === 'err' ? 'warn' : 'ok'} data-testid="me-message">{message.text}</p>}<p className="hint">笔记请只写自己的理解；不要记录真实个案信息，也不要把备份文件发到公共群。</p></section>
    <section className="panel"><h2>关于</h2><p className="muted">本站提供拉康理论专题阅读与大会预习材料。官方前瞻页收录用户提供的四篇官方文章正文，卡片为本站提炼；本站不是官方会务渠道，也不提供诊疗。会务变更以主办方通知为准。</p></section>
    <Sheet open={preview !== null} title="导入预览" onRequestClose={() => setPreview(null)} testId="import-sheet">{preview && <div className="filter-body"><p>备份含 收藏 {preview.counts.favorites}、已读 {preview.counts.read}、笔记 {preview.counts.notes}。{preview.dropped > 0 && `另有 ${preview.dropped} 项无法识别，已忽略。`}</p><p className="hint">合并：与本机数据取并集，同一张卡的两份笔记会都保留。覆盖：用备份替换本机全部数据。</p><div className="sheet-foot"><button type="button" className="btn" onClick={() => { actions.importState(preview.incoming, 'merge'); setPreview(null); setMessage({ kind: 'ok', text: '已合并导入。' }); }}>合并导入</button><button type="button" className="btn danger" onClick={() => { actions.importState(preview.incoming, 'overwrite'); setPreview(null); setMessage({ kind: 'ok', text: '已用备份覆盖本机数据。' }); }}>覆盖本机</button></div></div>}</Sheet>
    <Sheet open={confirmClear} title="清除本地数据？" onRequestClose={() => setConfirmClear(false)} testId="clear-sheet"><div className="filter-body"><p>将删除这台设备上的收藏、已读、笔记、阅读位置和显示设置，无法恢复。建议先导出备份。</p><div className="sheet-foot"><button type="button" className="btn" onClick={() => setConfirmClear(false)}>取消</button><button type="button" className="btn danger" data-testid="confirm-clear" onClick={() => { actions.clearAll(); setConfirmClear(false); setMessage({ kind: 'ok', text: '已清除。' }); }}>确认清除</button></div></div></Sheet>
  </main>;
}
