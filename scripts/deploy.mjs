// 前端部署：构建 dist/，打包上传到服务器并原子替换站点目录；旧版留在同级 <目录>.bak，可用 --rollback 换回。
// 用法：node scripts/deploy.mjs [--skip-build] [--dry-run] [--rollback]
// 环境变量：LAKANG_DEPLOY_HOST（ssh 别名，默认 tx）、LAKANG_DEPLOY_DIR（默认 /home/ubuntu/www-share/lakang）、LAKANG_DEPLOY_URL（上线后检查的地址）。
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const HOST = process.env.LAKANG_DEPLOY_HOST || 'tx';
const DIR = process.env.LAKANG_DEPLOY_DIR || '/home/ubuntu/www-share/lakang';
const URL = process.env.LAKANG_DEPLOY_URL || 'https://43.139.159.100/lakang/';
const TGZ = '.deploy-lakang.tgz'; // 相对路径：GNU tar 会把 C:\ 当成远程主机
const args = new Set(process.argv.slice(2));
const run = (cmd, a) => execFileSync(cmd, a, { stdio: 'inherit' });
const ssh = (script) => run('ssh', ['-o', 'BatchMode=yes', HOST, script]);

if (args.has('--rollback')) {
  ssh(`set -e; cd "$(dirname ${DIR})"; test -d ${DIR}.bak; rm -rf ${DIR}.rollback; mv ${DIR} ${DIR}.rollback; mv ${DIR}.bak ${DIR}; mv ${DIR}.rollback ${DIR}.bak`);
  console.log(`已回滚到旧版（当前版本留在 ${DIR}.bak）`);
  process.exit(0);
}

// 经 npm run deploy 调用时用 npm_execpath，免去 Windows 上 npm.cmd 必须开 shell 的问题
if (!args.has('--skip-build')) {
  const cli = process.env.npm_execpath;
  if (cli) run(process.execPath, [cli, 'run', 'build']); else run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
}
if (!existsSync('dist/index.html')) throw new Error('dist/index.html 不存在，先构建');
// 私人临床记录绝不能随站点上传（见 README「隐私设计」）
if (existsSync('dist/private')) throw new Error('dist/private 存在：真实记录不能部署，请先移走 public/private 并重新构建');

try {
  run('tar', ['czf', TGZ, '-C', 'dist', '.']);
  if (args.has('--dry-run')) { console.log('dry-run：已构建并打包，未上传'); rmSync(TGZ, { force: true }); process.exit(0); }
  run('scp', ['-q', TGZ, `${HOST}:/tmp/lakang-dist.tgz`]);
  // 解压到 .new，再 mv 换目录；旧目录留作 .bak
  ssh(`set -e; cd "$(dirname ${DIR})"; rm -rf ${DIR}.new; mkdir ${DIR}.new; tar xzf /tmp/lakang-dist.tgz -C ${DIR}.new; chmod -R u=rwX,go=rX ${DIR}.new; rm -rf ${DIR}.bak; mv ${DIR} ${DIR}.bak; mv ${DIR}.new ${DIR}; rm -f /tmp/lakang-dist.tgz`);
} finally {
  rmSync(TGZ, { force: true });
}

const code = execFileSync('curl', ['-sk', '-o', process.platform === 'win32' ? 'NUL' : '/dev/null', '-w', '%{http_code}', URL]).toString();
if (code !== '200') throw new Error(`上线后 ${URL} 返回 ${code}，可用 --rollback 换回旧版`);
console.log(`已部署到 ${HOST}:${DIR}，${URL} 返回 200；旧版在 ${DIR}.bak`);
