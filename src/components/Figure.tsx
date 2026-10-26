import type { CardFigure } from '../types';

// 三环布局取自 Graham Joncas《Lacan-Mathemes》lacan RSI.tex（MIT，见 public/licenses/lacan-mathemes-MIT.txt）：
// 圆心 I(1,1.5) S(2,0) R(0,0)，半径 1.5。交叉上下按《R.S.I.》1974-12-10 课（英译草稿第 17 页）：
// 符号环压在想象环上，实在环从下面那环（I）之下、上面那环（S）之上穿过。
const R = 1.5;
const RINGS = { I: [1, 1.5], S: [2, 0], R: [0, 0] } as const;
type Ring = keyof typeof RINGS;
const OVER: [Ring, Ring][] = [
  ['S', 'I'],
  ['I', 'R'],
  ['R', 'S'],
];
const X0 = -1.9;
const Y0 = 3.85;
const pt = (x: number, y: number) => [x - X0, Y0 - y].map((v) => +v.toFixed(3));

function crossings(a: Ring, b: Ring): number[] {
  const [x1, y1] = RINGS[a];
  const [x2, y2] = RINGS[b];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const h = Math.sqrt(R * R - (d / 2) ** 2);
  return [1, -1].map((s) => Math.atan2(dy / 2 + (s * h * dx) / d, dx / 2 - (s * h * dy) / d));
}

function arc(ring: Ring, at: number, half = 0.22) {
  const [cx, cy] = RINGS[ring];
  const [ax, ay] = pt(cx + R * Math.cos(at - half), cy + R * Math.sin(at - half));
  const [bx, by] = pt(cx + R * Math.cos(at + half), cy + R * Math.sin(at + half));
  return `M${ax} ${ay}A${R} ${R} 0 0 0 ${bx} ${by}`;
}

const overArcs = OVER.flatMap(([a, b]) => crossings(a, b).map((t) => arc(a, t)));

function Label({ x, y, main, sub }: { x: number; y: number; main: string; sub: string }) {
  const [tx, ty] = pt(x, y);
  return (
    <text x={tx} y={ty} textAnchor="middle" fontSize={0.3}>
      <tspan className="fig-main">{main}</tspan>
      <tspan className="fig-sub" x={tx} dy={0.3} fontSize={0.2}>
        {sub}
      </tspan>
    </text>
  );
}

function RsiKnot({ label }: { label: string }) {
  const [ax, ay] = pt(1, 0.36);
  const [sx, sy] = pt(1.82, 0.86);
  return (
    <svg className="fig-svg" viewBox="0 0 5.8 6.45" role="img" aria-label={label}>
      <g fill="none" strokeLinecap="butt">
        {(Object.keys(RINGS) as Ring[]).map((k) => {
          const [cx, cy] = pt(RINGS[k][0], RINGS[k][1]);
          return <circle key={k} cx={cx} cy={cy} r={R} className="fig-ring" />;
        })}
        {overArcs.map((d, i) => (
          <path key={`h${i}`} d={d} className="fig-gap" />
        ))}
        {overArcs.map((d, i) => (
          <path key={`o${i}`} d={d} className="fig-ring" />
        ))}
      </g>
      <Label x={1} y={3.45} main="想象 I" sub="一致性 consistance" />
      <Label x={3.05} y={-1.85} main="符号 S" sub="洞 trou" />
      <Label x={-1.05} y={-1.85} main="实在 R" sub="外存 ek-sistence" />
      <text x={ax} y={ay} textAnchor="middle" fontSize={0.3} className="fig-mark">
        a
      </text>
      <text x={sx} y={sy} textAnchor="middle" fontSize={0.22} className="fig-region">
        意义
      </text>
    </svg>
  );
}

const FIGURES: Record<string, (p: { label: string }) => React.ReactElement> = {
  'rsi-knot': RsiKnot,
};
export const figureIds = new Set(Object.keys(FIGURES));

export function Figure({ figure, credit = false }: { figure: CardFigure; credit?: boolean }) {
  const Art = FIGURES[figure.id];
  if (!Art) return null;
  return (
    <figure className="fig">
      <Art label={figure.alt} />
      <figcaption>
        {figure.caption}
        {credit && (
          <span className="fig-credit">
            图式据 Graham Joncas{' '}
            <a href="https://github.com/gjoncas/Lacan-Mathemes" target="_blank" rel="noopener noreferrer">
              Lacan-Mathemes
            </a>{' '}
            的 lacan RSI.tex 重绘；
            <a href="licenses/lacan-mathemes-MIT.txt" target="_blank" rel="noopener noreferrer">
              MIT 许可
            </a>
            。
          </span>
        )}
      </figcaption>
    </figure>
  );
}
