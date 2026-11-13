import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPetAssetCache } from '../src/lib/pet-assets.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('pending requests for the same pet image share one preparation', async () => {
  const pending = deferred();
  let preparations = 0;
  const assets = createPetAssetCache(() => { preparations++; return pending.promise; });
  const first = assets.load('/wave.webp');
  const second = assets.load('/wave.webp');
  assert.equal(first, second);
  pending.resolve();
  await Promise.all([first, second]);
  assert.equal(preparations, 1);
});

test('a prepared image can be used again without another decode', async () => {
  let preparations = 0;
  const assets = createPetAssetCache(async () => { preparations++; });
  await assets.load('/idle.webp');
  await assets.load('/idle.webp');
  assert.equal(preparations, 1);
});

test('an unresolved action does not block another image from preparing', async () => {
  const slow = deferred();
  const assets = createPetAssetCache(src => src === '/wave.webp' ? slow.promise : Promise.resolve());
  let oldReady = false;
  const old = assets.load('/wave.webp').then(() => { oldReady = true; });
  await assets.load('/jump.webp');
  assert.equal(oldReady, false);
  slow.resolve();
  await old;
});

test('a failed image is evicted so a later user action can retry', async () => {
  let preparations = 0;
  const assets = createPetAssetCache(async () => {
    if (++preparations === 1) throw new Error('decode failed');
  });
  await assert.rejects(assets.load('/work.webp'), /decode failed/);
  await assets.load('/work.webp');
  assert.equal(preparations, 2);
});
