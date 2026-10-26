// Render the existing book/card symbol in the indigo palette, without dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
const BG = [0x34, 0x36, 0x5c];
const WHITE = [0xff, 0xff, 0xff];
const GREY = [0xdc, 0xdc, 0xe5];
const SHAPES = [[136,96,240,320,36,WHITE],[176,156,160,22,11,BG],[176,204,160,14,7,GREY],[176,236,160,14,7,GREY],[176,268,104,14,7,GREY],[176,332,64,40,12,BG]];
function inRound(px, py, [x,y,w,h,r]) {
  const cx = Math.min(Math.max(px, x+r), x+w-r), cy = Math.min(Math.max(py, y+r), y+h-r);
  return (px-cx)**2+(py-cy)**2 <= r*r && px>=x && px<=x+w && py>=y && py<=y+h;
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
        let col=BG; for(const s of SHAPES) if(inRound(du,dv,s)) col=s[5];
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
console.log('indigo icons written');
