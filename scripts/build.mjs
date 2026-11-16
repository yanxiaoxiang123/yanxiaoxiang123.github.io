import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const lock = join(root, '.yanxx-build.lock');
const state = join(root, '.yanxx-build-state');
const borrowed = Boolean(process.env.YANXX_BUILD_LOCK_TOKEN);
const token = process.env.YANXX_BUILD_LOCK_TOKEN || randomUUID();
let owned = false;
let started = false;
let interrupted = 0;
let child;

try {
  if (borrowed) {
    // deploy.sh owns the lock across installation, build and snapshot creation.
    if (readFileSync(join(lock, 'owner'), 'utf8').split('\n')[0] !== token) {
      throw new Error('部署构建锁的所有者不匹配');
    }
  } else {
    try {
      mkdirSync(lock);
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error('本地构建或打包锁已存在；核实 .yanxx-build.lock/owner 后再重试');
      throw error;
    }
    owned = true;
    writeFileSync(join(lock, 'owner'), `${token}\npid=${process.pid}\nkind=build\n`);
  }

  writeFileSync(state, 'building\n');
  started = true;
  for (const [signal, status] of [['SIGHUP', 129], ['SIGINT', 130], ['SIGTERM', 143]]) {
    process.on(signal, () => {
      interrupted = status;
      child?.kill(signal);
    });
  }
  child = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build', ...process.argv.slice(2)], {
    cwd: root,
    stdio: 'inherit',
  });
  const status = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve(signal ? 1 : code));
  });
  process.exitCode = interrupted || status || 0;
  writeFileSync(state, interrupted ? 'interrupted\n' : status === 0 ? 'ready\n' : 'failed\n');
} catch (error) {
  if (started) writeFileSync(state, 'failed\n');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Interrupted builds can leave worker processes behind. Keep the lock until
  // an operator has checked them; never automatically steal an existing lock.
  if (owned && !interrupted) {
    unlinkSync(join(lock, 'owner'));
    rmdirSync(lock);
  } else if (interrupted) {
    console.error('构建已中断；保留 .yanxx-build.lock，请核实构建及子进程均已停止后再清理');
  }
}
