import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const shellPath = path => path.replaceAll('\\', '/').replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
const oldHome = '<html>old release</html>';
const newHome = '<html>new release</html>';

// Network, dependency installation and service boundaries are replaced. The
// Bash transaction and build wrapper run with real hashing, locks and renames.
// File-tool wrappers forward normal operations and inject targeted failures.
function fixture(t, { siteName = "site's pages", privateTemp = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "yanxx deploy's test-"));
  const server = join(root, 'server');
  const site = join(server, siteName);
  const lock = join(server, `.${basename(site)}.deploy.lock`);
  const running = [];
  t.after(async () => {
    if (running.length) {
      writeFileSync(join(root, 'continue'), 'release');
      writeFileSync(join(root, 'build-continue'), 'release');
      writeFileSync(join(root, 'copy-continue'), 'release');
      await Promise.allSettled(running);
    }
    rmSync(root, { recursive: true, force: true });
  });
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'out'));
  mkdirSync(join(site, '_next/static/chunks'), { recursive: true });
  writeFileSync(join(site, 'index.html'), oldHome);
  writeFileSync(join(site, 'stale.txt'), 'only in the old release');
  writeFileSync(join(site, '_next/static/chunks/old.js'), 'old lazy chunk');
  writeFileSync(join(site, '_next/static/chunks/shared.js'), 'old shared chunk');
  for (const name of ['deploy.sh', 'deploy-remote.sh', 'build.mjs']) {
    const source = new URL(`../scripts/${name}`, import.meta.url);
    if (existsSync(source)) copyFileSync(source, join(root, 'scripts', name));
  }
  const buildScript = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts.build;
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { build: buildScript } }));
  mkdirSync(join(root, 'node_modules/next/dist/bin'), { recursive: true });
  mkdirSync(join(root, 'node_modules/.bin'), { recursive: true });
  writeFileSync(join(root, 'node_modules/next/dist/bin/next'), `
const fs = require('node:fs');
fs.writeFileSync('out/index.html', '<html>building release</html>');
fs.writeFileSync('build-started', 'running');
if (process.env.DEPLOY_TEST_BUILD_FAIL) process.exit(1);
(async () => {
  const deadline = Date.now() + 15000;
  while (!fs.existsSync('build-continue') && !process.env.DEPLOY_TEST_BUILD_NOWAIT) {
    if (Date.now() > deadline) process.exit(1);
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  fs.writeFileSync('out/index.html', '<html>new release</html>');
})();
`);
  writeFileSync(join(root, 'node_modules/.bin/next'), '#!/usr/bin/env bash\nnode node_modules/next/dist/bin/next "$@"\n', { mode: 0o755 });
  writeFileSync(join(root, 'node_modules/.bin/next.cmd'), '@node node_modules\\next\\dist\\bin\\next %*\r\n');
  const commands = join(root, 'commands.sh');
  writeFileSync(commands, `npm() {
  if [[ "$1" == ci ]]; then
    printf 'installed' > "$DEPLOY_TEST_ROOT/installed"
  else
    command npm "$@"
  fi
}
ssh() {
  printf '%s\\0' "$@" >> "$DEPLOY_SSH_LOG"
  local remote arg
  for arg in "$@"; do remote=$arg; done
  if [[ "$DEPLOY_TEST_FAULT" == upload ]]; then
    command cat > "$DEPLOY_TEST_ROOT/broken-upload"
    printf 'interrupted transfer' > "$DEPLOY_TEST_ROOT/broken-upload"
    DEPLOY_TEST_REMOTE=1 command bash -c "$remote" < "$DEPLOY_TEST_ROOT/broken-upload"
  else
    DEPLOY_TEST_REMOTE=1 command bash -c "$remote"
  fi
}
mkdir() {
  command mkdir "$@" || return
  local arg
  for arg in "$@"; do :; done
  if [[ "$DEPLOY_TEST_REMOTE" == 1 && "$DEPLOY_TEST_FAULT" == acquire-signal && "$arg" == *.deploy.lock ]]; then kill -TERM "$$"; fi
}
cp() {
  if [[ "$DEPLOY_TEST_REMOTE" != 1 && "$DEPLOY_TEST_HOLD_COPY" == 1 && "$*" == *out/.* ]]; then
    : > "$DEPLOY_TEST_ROOT/copying"
    local attempt
    for ((attempt=0; attempt<500; attempt++)); do
      [[ ! -f "$DEPLOY_TEST_ROOT/copy-continue" ]] || break
      command sleep 0.02
    done
    [[ -f "$DEPLOY_TEST_ROOT/copy-continue" ]] || return 1
  fi
  command cp "$@"
}
nginx() {
  printf 'nginx\\n' >> "$DEPLOY_TEST_ROOT/services.log"
  [[ "$DEPLOY_TEST_FAULT" != preflight ]] || return 1
  if [[ "$DEPLOY_TEST_HOLD" == 1 ]]; then
    : > "$DEPLOY_TEST_ROOT/locked"
    local attempt
    for ((attempt=0; attempt<500; attempt++)); do
      [[ ! -f "$DEPLOY_TEST_ROOT/continue" ]] || return 0
      command sleep 0.02
    done
    return 1
  fi
}
systemctl() {
  printf 'reload\\n' >> "$DEPLOY_TEST_ROOT/services.log"
  if [[ "$DEPLOY_TEST_FAULT" == double-signal && "$(< "$DEPLOY_TEST_SITE/index.html")" == '<html>new release</html>' ]]; then kill -TERM "$$"; return 1; fi
  if [[ "$DEPLOY_TEST_FAULT" == reload || "$DEPLOY_TEST_FAULT" == rollback ]]; then
    [[ "$(< "$DEPLOY_TEST_SITE/index.html")" != '<html>new release</html>' ]] || return 1
  fi
}
curl() {
  local arg output= next=0
  for arg in "$@"; do
    if [[ "$next" == 1 ]]; then output=$arg; next=0; fi
    [[ "$arg" != --output && "$arg" != -o ]] || next=1
  done
  [[ -n "$output" ]] || return 64
  if [[ "$DEPLOY_TEST_FAULT" == health && "$(< "$DEPLOY_TEST_SITE/index.html")" == '<html>new release</html>' ]]; then
    return 22
  fi
  if [[ "$DEPLOY_TEST_FAULT" == response ]]; then
    printf '<html>old release</html>' > "$output"
  else
    command cp "$DEPLOY_TEST_SITE/index.html" "$output" || return 22
  fi
  printf '200'
}
tar() {
  command tar "$@" || return
  if [[ "$DEPLOY_TEST_REMOTE" == 1 && "$DEPLOY_TEST_FAULT" == checksum && "$1" == -xf ]]; then
    local arg directory= next=0
    for arg in "$@"; do
      if [[ "$next" == 1 ]]; then directory=$arg; next=0; fi
      [[ "$arg" != -C ]] || next=1
    done
    printf 'corrupt extracted chunk' > "$directory/site/_next/static/chunks/app.js"
  fi
}
mv() {
  local arg source= destination=
  for arg in "$@"; do source=$destination; destination=$arg; done
  if [[ "$DEPLOY_TEST_REMOTE" == 1 ]]; then
    if [[ "$DEPLOY_TEST_FAULT" == switch && "$source" == */site && "$destination" == "$DEPLOY_TEST_SITE" ]]; then return 1; fi
    if [[ "$DEPLOY_TEST_FAULT" == rollback && "$source" == */previous ]]; then return 1; fi
  fi
  command mv "$@" || return
  if [[ "$DEPLOY_TEST_REMOTE" == 1 && "$DEPLOY_TEST_FAULT" == double-signal && "$destination" == */failed ]]; then kill -HUP "$$"; kill -TERM "$$"; fi
  if [[ "$DEPLOY_TEST_REMOTE" == 1 && "$DEPLOY_TEST_FAULT" == signal && "$source" == "$DEPLOY_TEST_SITE" ]]; then
    kill -TERM "$$"
  fi
}
`);
  const env = { ...process.env, BASH_ENV: shellPath(commands), SKIP_BUILD: '1',
    DEPLOY_HOST: 'test@example.invalid', DEPLOY_PATH: shellPath(site),
    DEPLOY_VERIFY_URL: 'http://127.0.0.1/',
    DEPLOY_SSH_LOG: shellPath(join(root, 'ssh.args')),
    DEPLOY_TEST_ROOT: shellPath(root), DEPLOY_TEST_SITE: shellPath(site),
    DEPLOY_TEST_FAULT: '', DEPLOY_TEST_HOLD: '', DEPLOY_TEST_REMOTE: '', DEPLOY_TEST_HOLD_COPY: '' };
  if (privateTemp) {
    const directory = join(root, 'temp[private]');
    mkdirSync(directory);
    env.TMPDIR = shellPath(directory);
  }
  const releases = () => readdirSync(server).filter(name => name.startsWith(`.${basename(site)}.release.`)).map(name => join(server, name));
  return { root, server, site, lock, env, releases,
    home() { return readFileSync(join(site, 'index.html'), 'utf8'); },
    args() { return readFileSync(join(root, 'ssh.args'), 'utf8').split('\0').filter(Boolean); },
    complete() {
      writeFileSync(join(root, 'out/index.html'), newHome);
      mkdirSync(join(root, 'out/_next/static/chunks'), { recursive: true });
      writeFileSync(join(root, 'out/_next/static/chunks/app.js'), 'new app chunk');
      writeFileSync(join(root, 'out/_next/static/chunks/shared.js'), 'new shared chunk');
    },
    run(extra = {}) { return spawnSync('bash', ['scripts/deploy.sh'], { cwd: root,
      env: { ...env, ...extra }, encoding: 'utf8', input: '', timeout: 20_000 }); },
    build(extra = {}) { return spawnSync('bash', ['-c', 'npm run build'], { cwd: root,
      env: { ...env, ...extra }, encoding: 'utf8', input: '', timeout: 20_000 }); },
    start(extra = {}, command = ['scripts/deploy.sh']) {
      const child = spawn('bash', command, { cwd: root, env: { ...env, ...extra } });
      child.stdin.end();
      let stdout = '', stderr = '', finished = false;
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      const result = new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', status => { finished = true; resolve({ status, stdout, stderr }); });
      });
      running.push(result);
      return { result, finished: () => finished };
    },
  };
}

function assertOldSite(f) {
  assert.equal(f.home(), oldHome);
  assert.equal(readFileSync(join(f.site, 'stale.txt'), 'utf8'), 'only in the old release');
  assert.equal(readFileSync(join(f.site, '_next/static/chunks/old.js'), 'utf8'), 'old lazy chunk');
}

for (const [name, incomplete] of [['an empty reused build', false], ['a homepage without JavaScript', true]]) {
  test(`${name} is rejected before contacting the server`, t => {
    const f = fixture(t);
    if (incomplete) writeFileSync(join(f.root, 'out/index.html'), newHome);
    const result = f.run();
    assert.equal(result.status, 1, result.stderr);
    assert.throws(() => f.args(), { code: 'ENOENT' });
    assertOldSite(f);
  });
}

test('a verified release replaces the site, retains lazy chunks and keeps an intact backup', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.home(), newHome);
  assert.equal(existsSync(join(f.site, 'stale.txt')), false);
  assert.equal(readFileSync(join(f.site, '_next/static/chunks/old.js'), 'utf8'), 'old lazy chunk');
  assert.equal(readFileSync(join(f.site, '_next/static/chunks/shared.js'), 'utf8'), 'new shared chunk');
  const backups = f.releases().map(path => join(path, 'previous')).filter(existsSync);
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(join(backups[0], 'index.html'), 'utf8'), oldHome);
  assert.equal(readFileSync(join(backups[0], 'stale.txt'), 'utf8'), 'only in the old release');
  assert.equal(existsSync(f.lock), false);
});

test('SSH preserves key and destination paths containing spaces and single quotes', t => {
  const f = fixture(t);
  f.complete();
  f.env.DEPLOY_KEY = "/keys/Review User/key's name";
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const args = f.args();
  assert.equal(args[args.indexOf('-i') + 1], f.env.DEPLOY_KEY);
  assert.equal(f.home(), newHome);
});

for (const [fault, description] of [
  ['upload', 'a truncated upload'],
  ['checksum', 'an extracted file checksum mismatch'],
  ['preflight', 'a failing Nginx preflight'],
]) {
  test(`${description} leaves the current site intact`, t => {
    const f = fixture(t);
    f.complete();
    const result = f.run({ DEPLOY_TEST_FAULT: fault });
    assert.notEqual(result.status, 0, result.stdout);
    assertOldSite(f);
    assert.equal(existsSync(f.lock), false);
  });
}

for (const [fault, description] of [
  ['switch', 'the second directory rename fails'],
  ['signal', 'TERM arrives immediately after moving the old directory'],
  ['reload', 'Nginx reload fails on the new release'],
  ['health', 'the HTTP check fails on the new release'],
  ['response', 'HTTP returns 200 with the wrong homepage'],
  ['double-signal', 'a second termination signal arrives during rollback'],
]) {
  test(`the old site is restored when ${description}`, t => {
    const f = fixture(t);
    f.complete();
    const result = f.run({ DEPLOY_TEST_FAULT: fault });
    assert.notEqual(result.status, 0, result.stdout);
    assertOldSite(f);
    assert.equal(existsSync(f.lock), false);
    if (['reload', 'health', 'response'].includes(fault)) {
      const failed = f.releases().map(path => join(path, 'failed')).filter(existsSync);
      assert.equal(failed.length, 1);
      assert.equal(readFileSync(join(failed[0], 'index.html'), 'utf8'), newHome);
      assert.equal(readFileSync(join(f.site, '_next/static/chunks/app.js'), 'utf8'), 'new app chunk');
      assert.equal(readFileSync(join(f.site, '_next/static/chunks/shared.js'), 'utf8'), 'old shared chunk');
    }
  });
}

test('an unsuccessful rollback retains the lock and backup and blocks another deployment', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run({ DEPLOY_TEST_FAULT: 'rollback' });
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(existsSync(f.lock), true);
  const backups = f.releases().map(path => join(path, 'previous')).filter(existsSync);
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(join(backups[0], 'index.html'), 'utf8'), oldHome);
  assert.notEqual(f.run().status, 0);
  assert.equal(existsSync(f.lock), true);
});

test('an existing deployment lock is neither bypassed nor removed', t => {
  const f = fixture(t);
  f.complete();
  mkdirSync(f.lock);
  writeFileSync(join(f.lock, 'owner'), 'another release');
  const result = f.run();
  assert.notEqual(result.status, 0, result.stdout);
  assertOldSite(f);
  assert.equal(readFileSync(join(f.lock, 'owner'), 'utf8'), 'another release');
});

test('a second deployment cannot publish while the first holds the lock', async t => {
  const f = fixture(t);
  f.complete();
  const first = f.start({ DEPLOY_TEST_HOLD: '1' });
  const deadline = Date.now() + 10_000;
  while (!existsSync(join(f.root, 'locked')) && !first.finished() && Date.now() < deadline) await delay(25);
  assert.equal(existsSync(join(f.root, 'locked')), true, 'first deployment never reached its locked preflight');
  assertOldSite(f);
  const second = f.run();
  assert.notEqual(second.status, 0, second.stdout);
  assertOldSite(f);
  writeFileSync(join(f.root, 'continue'), 'release');
  const result = await first.result;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.home(), newHome);
});

test('a first deployment creates the site only after validation', t => {
  const f = fixture(t);
  f.complete();
  rmSync(f.site, { recursive: true });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.home(), newHome);
  assert.equal(existsSync(f.lock), false);
});

test('a relative destination is rejected before contacting the server', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run({ DEPLOY_PATH: 'relative-site' });
  assert.notEqual(result.status, 0, result.stdout);
  assert.throws(() => f.args(), { code: 'ENOENT' });
  assertOldSite(f);
});

test('a signal at lock acquisition cannot orphan an ownerless remote lock', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run({ DEPLOY_TEST_FAULT: 'acquire-signal' });
  assert.equal(existsSync(f.lock), false, result.stderr);
  assert.ok([oldHome, newHome].includes(f.home()));
});

for (const [name, options] of [
  ['destination', { siteName: 'site[prod]' }],
  ['temporary directory', { privateTemp: true }],
]) {
  test(`a ${name} with glob characters is treated as a literal path`, t => {
    const f = fixture(t, options);
    f.complete();
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.home(), newHome);
  });
}

test('a failed first deployment removes the candidate and releases the lock', t => {
  const f = fixture(t);
  f.complete();
  rmSync(f.site, { recursive: true });
  const result = f.run({ DEPLOY_TEST_FAULT: 'health' });
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(existsSync(f.site), false);
  assert.equal(existsSync(f.lock), false);
  assert.ok(f.releases().some(path => existsSync(join(path, 'failed'))));
});

test('default deployment installs and builds while retaining its snapshot lock', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run({ SKIP_BUILD: '0', DEPLOY_TEST_BUILD_NOWAIT: '1' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(f.root, 'installed')), true);
  assert.equal(existsSync(join(f.root, 'build-started')), true);
  assert.equal(existsSync(join(f.root, '.yanxx-build.lock')), false);
  assert.equal(f.home(), newHome);
});

test('a build failure in default deployment blocks upload and a subsequent reused export', t => {
  const f = fixture(t);
  f.complete();
  const result = f.run({ SKIP_BUILD: '0', DEPLOY_TEST_BUILD_FAIL: '1' });
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(existsSync(join(f.root, '.yanxx-build.lock')), false);
  assert.notEqual(f.run().status, 0);
  assert.throws(() => f.args(), { code: 'ENOENT' });
  assertOldSite(f);
  const retry = f.run({ SKIP_BUILD: '0', DEPLOY_TEST_BUILD_NOWAIT: '1' });
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(f.home(), newHome);
});

test('a build can resume after the snapshot while the remote release is still locked', async t => {
  const f = fixture(t);
  f.complete();
  const deploy = f.start({ DEPLOY_TEST_HOLD: '1' });
  await awaitMarker(f, deploy, 'locked');
  const build = f.build({ DEPLOY_TEST_BUILD_NOWAIT: '1' });
  assert.equal(build.status, 0, build.stderr);
  // Mutating out after the snapshot must not change the pending release.
  writeFileSync(join(f.root, 'out/index.html'), '<html>later build</html>');
  writeFileSync(join(f.root, 'continue'), 'release');
  const result = await deploy.result;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.home(), newHome);
});

async function awaitMarker(f, process, name) {
  const deadline = Date.now() + 10_000;
  while (!existsSync(join(f.root, name)) && !process.finished() && Date.now() < deadline) await delay(25);
  assert.equal(existsSync(join(f.root, name)), true, `process never reached ${name}`);
}

test('deployment refuses a mutable export while the normal build command holds the local lock', async t => {
  const f = fixture(t);
  f.complete();
  const build = f.start({}, ['-c', 'npm run build']);
  await awaitMarker(f, build, 'build-started');
  const deploy = f.run();
  assert.notEqual(deploy.status, 0, deploy.stdout);
  assert.throws(() => f.args(), { code: 'ENOENT' });
  assertOldSite(f);
  writeFileSync(join(f.root, 'build-continue'), 'release');
  const result = await build.result;
  assert.equal(result.status, 0, result.stderr);
  const retry = f.run();
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(f.home(), newHome);
});

test('a failed normal build cannot leave a partial export eligible for deployment', t => {
  const f = fixture(t);
  f.complete();
  const build = f.build({ DEPLOY_TEST_BUILD_FAIL: '1' });
  assert.notEqual(build.status, 0, build.stdout);
  const deploy = f.run();
  assert.notEqual(deploy.status, 0, deploy.stdout);
  assert.throws(() => f.args(), { code: 'ENOENT' });
  assertOldSite(f);
});

test('the normal build command cannot modify out while deployment is taking its snapshot', async t => {
  const f = fixture(t);
  f.complete();
  const deploy = f.start({ DEPLOY_TEST_HOLD_COPY: '1' });
  await awaitMarker(f, deploy, 'copying');
  const build = f.build({ DEPLOY_TEST_BUILD_NOWAIT: '1' });
  assert.notEqual(build.status, 0, build.stdout);
  assert.equal(existsSync(join(f.root, 'build-started')), false);
  writeFileSync(join(f.root, 'copy-continue'), 'release');
  const result = await deploy.result;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.home(), newHome);
});
