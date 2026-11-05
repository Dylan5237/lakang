// 三环纽结标记；几何与 public/icon.svg 相同（见 Figure.tsx 的 RSI 三环）。环用 currentColor，交叉处的缺口用 --logo-gap 抠出。
const OVER = 'M0.579 0.481A1.5 1.5 0 0 1 0.534 -0.318M2.857 1.231A1.5 1.5 0 0 1 2.102 1.497M1.102 0.003A1.5 1.5 0 0 1 1.857 0.269M-0.466 1.818A1.5 1.5 0 0 1 -0.421 1.019M1.262 0.811A1.5 1.5 0 0 1 0.666 1.344M0.666 -1.344A1.5 1.5 0 0 1 1.262 -0.811';

export function LogoMark({ className }: { className?: string }) {
  return <svg className={className} viewBox="-1.75 -3.5 5.5 5.5" aria-hidden="true" fill="none">
    <g transform="scale(1 -1)">
    <g stroke="currentColor" strokeWidth=".24">
      <circle cx="1" cy="1.5" r="1.5" /><circle cx="2" cy="0" r="1.5" /><circle cx="0" cy="0" r="1.5" />
    </g>
    <path d={OVER} stroke="var(--logo-gap, var(--surface))" strokeWidth=".48" />
    <path d={OVER} stroke="currentColor" strokeWidth=".24" />
    </g>
  </svg>;
}
