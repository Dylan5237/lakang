import { createServer, type Server } from 'node:http';
import { cpSync, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

export const DIST = join(process.cwd(), 'dist');

export function copyDist(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lakang-dist-'));
  cpSync(DIST, dir, { recursive: true });
  return dir;
}

// 在 prefix 子路径下托管 root 目录，模拟 GitHub Pages 项目站点(如 /lakang/)
export function serve(root: string, prefix: string): Promise<{ url: string; server: Server; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!path.startsWith(prefix)) {
      res.writeHead(404).end('outside prefix');
      return;
    }
    let rel = normalize(path.slice(prefix.length)).replace(/^([/\\])+/, '');
    if (rel === '' || rel === '.') rel = 'index.html';
    const file = join(root, rel);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${port}${prefix}`,
        server,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
