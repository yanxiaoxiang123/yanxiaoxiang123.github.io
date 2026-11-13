import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMotionHint } from '../src/lib/motion-hint.ts';

function fixture() {
  let now = 0, nextId = 0;
  const tasks = new Map(), changes = [];
  const hint = createMotionHint(active => changes.push(active), {
    set(callback, delay) { const id = ++nextId; tasks.set(id, { callback, at: now + delay }); return id; },
    clear(id) { tasks.delete(id); },
  });
  return { hint, changes, tasks,
    advance(ms) { now += ms; for (const [id, task] of [...tasks]) if (task.at <= now) { tasks.delete(id); task.callback(); } },
  };
}

test('composition hint has no idle work and expires after motion stops', () => {
  const f = fixture();
  assert.equal(f.tasks.size, 0);
  f.hint.pulse(); assert.deepEqual(f.changes, [true]);
  f.advance(179); assert.deepEqual(f.changes, [true]);
  f.advance(1); assert.deepEqual(f.changes, [true, false]);
  assert.equal(f.tasks.size, 0);
});

test('continued motion extends one release task without repeating active writes', () => {
  const f = fixture();
  f.hint.pulse(); f.advance(100); f.hint.pulse();
  assert.equal(f.tasks.size, 1);
  assert.deepEqual(f.changes, [true]);
  f.advance(179); assert.deepEqual(f.changes, [true]);
  f.advance(1); assert.deepEqual(f.changes, [true, false]);
});

test('pause or unmount clears the hint and invalidates an obsolete release', () => {
  const f = fixture();
  f.hint.pulse(); const obsolete = [...f.tasks.values()][0].callback;
  f.hint.clear(); assert.deepEqual(f.changes, [true, false]);
  assert.equal(f.tasks.size, 0);
  f.hint.pulse(); obsolete();
  assert.deepEqual(f.changes, [true, false, true]);
  f.advance(180); assert.deepEqual(f.changes, [true, false, true, false]);
});

test('clearing an idle or already-cleared hint causes no writes or work', () => {
  const f = fixture();
  f.hint.clear(); f.hint.clear();
  assert.deepEqual(f.changes, []); assert.equal(f.tasks.size, 0);
});
