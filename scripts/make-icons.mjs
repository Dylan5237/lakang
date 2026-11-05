// Render the Borromean-ring mark (same geometry as public/icon.svg) on oxblood, without dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
const BG = [0x8f, 0x2f, 0x25];
const PAPER = [0xf6, 0xef, 0xe2];
const R = 1.5, W = 0.12, GAP = 0.24;
const RINGS = [[1, 1.5], [2, 0], [0, 0]];
// over-arcs: [ring index, centre angle, half-span]; angles from the crossings of each pair, see src/components/Figure.tsx
const ARCS = [[1, 3.0849], [1, 1.2327], [0, -1.2327], [0, -3.0849], [2, 0.8411], [2, -0.8411]].map(([i, t]) => [i, t, 0.27]);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function onRing(mx, my, i, w) { const [cx, cy] = RINGS[i]; return Math.abs(Math.hypot(mx - cx, my - cy) - R) <= w; }
function onArc(mx, my, [i, t, h], w) { const [cx, cy] = RINGS[i]; return onRing(mx, my, i, w) && Math.abs(wrap(Math.atan2(my - cy, mx - cx) - t)) <= h; }
function colorAt(mx, my) {
  let col = BG;
  if (RINGS.some((_, i) => onRing(mx, my, i, W))) col = PAPER;
  if (ARCS.some((a) => onArc(mx, my, a, GAP))) col = BG;
  if (ARCS.some((a) => onArc(mx, my, a, W))) col = PAPER;
  return col;
}
const T = new Uint32Array(256);
for (let n=0;n<256;n++) { let c=n; for(let k=0;k<8;k++) c=c&1 ? 0xedb88320^(c>>>1) : c>>>1; T[n]=c>>>0; }
function crc(buf) { let c=0xffffffff; for(const b of buf) c=T[(c^b)&0xff]^(c>>>8); return (c^0xffffffff)>>>0; }
function chunk(type,data) { const len=Buffer.alloc(4); len.writeUInt32BE(data.length); const td=Buffer.concat([Buffer.from(type),data]); const c=Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len,td,c]); }
function render(size,scale) {
  const SS=3, raw=Buffer.alloc((size*3+1)*size), off=(512-512*scale)/2;
  for(let y=0;y<size;y++) {
    raw[y*(size*3+1)]=0;
    for(let x=0;x<size;x++) {
      let r=0,g=0,b=0;
      for(let sy=0;sy<SS;sy++) for(let sx=0;sx<SS;sx++) {
        const u=((x+(sx+.5)/SS)/size)*512, v=((y+(sy+.5)/SS)/size)*512;
        const du=(u-off)/scale,dv=(v-off)/scale;
        const col=colorAt((du-256)/64+1, -(dv-256)/64+0.75);
        r+=col[0];g+=col[1];b+=col[2];
      }
      const n=SS*SS,i=y*(size*3+1)+1+x*3;
      raw[i]=Math.round(r/n);raw[i+1]=Math.round(g/n);raw[i+2]=Math.round(b/n);
    }
  }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4); ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
mkdirSync('public',{recursive:true});
writeFileSync('public/icon-192.png',render(192,1));
writeFileSync('public/icon-512.png',render(512,1));
writeFileSync('public/icon-maskable-512.png',render(512,.8));
console.log('icons written');
