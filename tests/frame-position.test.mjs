import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFramePositionWriter } from '../src/lib/frame-position.ts';

function fixture() {
  const queued = new Map();
  const cancelled = [];
  const writes = [];
  let id = 0;
  const writer = createFramePositionWriter(point => writes.push(point), {
    request(callback) { queued.set(++id, callback); return id; },
    cancel(id) { cancelled.push(id); queued.delete(id); },
  });
  return { writer, queued, cancelled, writes, frame() { const callbacks = [...queued.values()]; queued.clear(); callbacks.forEach(fn => fn()); } };
}
test('100 pointer samples cause one frame write with the latest position', () => {
  const f = fixture();
  for (let i = 0; i < 100; i++) f.writer.schedule({ x: i, y: i * 2 });
  assert.equal(f.queued.size, 1);
  assert.equal(f.writes.length, 0);
  f.frame();
  assert.deepEqual(f.writes, [{ x: 99, y: 198 }]);
});
test('finishing before the frame writes the final point and cancels the pending work', () => {
  const f = fixture();
  f.writer.schedule({ x: 20, y: 30 });
  const stale = [...f.queued.values()][0];
  f.writer.sync({ x: 25, y: 40 });
  stale();
  assert.equal(f.queued.size, 0);
  assert.deepEqual(f.writes, [{ x: 25, y: 40 }]);
});
test('cancelling or unmounting prevents queued callbacks from moving the element', () => {
  const f = fixture();
  f.writer.schedule({ x: 20, y: 30 });
  const stale = [...f.queued.values()][0];
  f.writer.cancel();
  stale();
  assert.deepEqual(f.writes, []);
  assert.equal(f.queued.size, 0);
});
test('a new drag cannot be overwritten by a stale frame from the previous drag', () => {
  const f = fixture();
  f.writer.schedule({ x: 1, y: 2 });
  const stale = [...f.queued.values()][0];
  f.writer.cancel();
  f.writer.schedule({ x: 50, y: 60 });
  stale();
  f.frame();
  assert.deepEqual(f.writes, [{ x: 50, y: 60 }]);
});
