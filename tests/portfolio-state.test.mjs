import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialPortfolioState as initial, portfolioReducer as reduce } from '../src/lib/portfolio-state.ts';

const ready = reduce(initial, { type: 'ready', attempt: 0 });
test('only one startup is accepted, even for queued repeated input', () => {
  const booting = reduce(ready, { type: 'start' });
  assert.equal(booting.phase, 'booting');
  for (let i = 0; i < 20; i++) assert.strictEqual(reduce(booting, { type: 'start' }), booting);
  assert.strictEqual(reduce(initial, { type: 'start' }), initial);
});
test('works → about → home cancels pending navigation back to the current page', () => {
  let s = reduce(ready, { type: 'navigate', target: 'works' });
  const firstId = s.navigation.id;
  s = reduce(s, { type: 'navigate', target: 'about' });
  const secondId = s.navigation.id;
  s = reduce(s, { type: 'navigate', target: 'home' });
  assert.equal(s.navigation, null);
  assert.strictEqual(reduce(s, { type: 'commit-navigation', id: firstId }), s);
  assert.strictEqual(reduce(s, { type: 'commit-navigation', id: secondId }), s);
  assert.equal(s.currentTab, 'home');
});
test('only the most recent navigation may commit', () => {
  const a = reduce(ready, { type: 'navigate', target: 'about' });
  const b = reduce(a, { type: 'navigate', target: 'works' });
  assert.strictEqual(reduce(b, { type: 'commit-navigation', id: a.navigation.id }), b);
  const c = reduce(b, { type: 'commit-navigation', id: b.navigation.id });
  assert.equal(c.currentTab, 'works');
  assert.deepEqual(c.visited, { home: true, works: true, about: false });
});
test('old startup callbacks cannot affect a restarted intro', () => {
  const reset = reduce(reduce(ready, { type: 'start' }), { type: 'restart' });
  for (const type of ['ready', 'booted', 'cover', 'desktop']) {
    assert.strictEqual(reduce(reset, { type, attempt: 0 }), reset);
  }
  assert.equal(reset.attempt, 1);
});
test('startup phases reject out-of-order completion', () => {
  assert.strictEqual(reduce(ready, { type: 'desktop', attempt: 0 }), ready);
  let s = reduce(ready, { type: 'start' });
  for (const [type, phase] of [['booted', 'zooming'], ['cover', 'covered'], ['desktop', 'desktop']]) {
    s = reduce(s, { type, attempt: 0 });
    assert.equal(s.phase, phase);
  }
  assert.equal(s.desktopMounted, true);
});
test('navigation and restart retain the desktop mount and visited history', () => {
  let s = { ...ready, phase: 'desktop', desktopMounted: true };
  s = reduce(s, { type: 'navigate', target: 'works' });
  s = reduce(s, { type: 'commit-navigation', id: s.navigation.id });
  s = reduce(s, { type: 'navigate', target: 'home' });
  s = reduce(s, { type: 'commit-navigation', id: s.navigation.id });
  assert.equal(s.phase, 'desktop');
  s = reduce(s, { type: 'restart' });
  assert.equal(s.desktopMounted, true);
  assert.equal(s.visited.works, true);
});
