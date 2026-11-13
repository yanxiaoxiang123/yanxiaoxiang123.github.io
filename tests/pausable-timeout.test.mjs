import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPausableTimeout } from '../src/lib/pausable-timeout.ts';

function fixture() {
  let now = 0;
  let nextId = 0;
  const queue = new Map();
  const task = createPausableTimeout({
    now: () => now,
    set(callback, delay) { queue.set(++nextId, { callback, at: now + delay }); return nextId; },
    clear(id) { queue.delete(id); },
  });
  return { task, queue,
    advance(ms) {
      now += ms;
      for (const [id, job] of [...queue]) {
        if (job.at <= now) { queue.delete(id); job.callback(); }
      }
    },
  };
}

test('pausing releases the timer and resumes only its remaining time', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(1000, 'bubble'); f.task.resume(() => { calls++; });
  f.advance(350); f.task.pause();
  assert.equal(f.queue.size, 0);
  f.advance(5000); assert.equal(calls, 0);
  f.task.configure(1000, 'bubble'); f.task.resume(() => { calls++; });
  f.advance(649); assert.equal(calls, 0);
  f.advance(1); assert.equal(calls, 1);
});
test('completed tasks do not replay after pause and resume', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(260, 'boot-complete'); f.task.resume(() => { calls++; });
  f.advance(260); assert.equal(calls, 1);
  f.task.pause(); f.task.configure(260, 'boot-complete'); f.task.resume(() => { calls++; });
  f.advance(1000); assert.equal(calls, 1); assert.equal(f.queue.size, 0);
});
test('a replacement discards the previous deadline and invalidates queued callbacks', () => {
  const f = fixture(); const calls = [];
  f.task.configure(220, 'tab-1'); f.task.resume(() => { calls.push('old'); });
  const oldCallback = [...f.queue.values()][0].callback;
  f.advance(100);
  f.task.configure(220, 'tab-2'); f.task.resume(() => { calls.push('new'); });
  assert.equal(f.queue.size, 1);
  oldCallback(); f.advance(219); assert.deepEqual(calls, []);
  f.advance(1); assert.deepEqual(calls, ['new']);
});
test('cancelling on unmount leaves no timer and invalidates a captured callback', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(760, 'jump'); f.task.resume(() => { calls++; });
  const stale = [...f.queue.values()][0].callback;
  f.task.cancel(); f.task.cancel(); stale(); f.advance(1000);
  assert.equal(f.queue.size, 0); assert.equal(calls, 0);
});
test('a stale callback from before a pause cannot complete the resumed task', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(840, 'action'); f.task.resume(() => { calls++; });
  const stale = [...f.queue.values()][0].callback;
  f.advance(200); f.task.pause(); f.task.resume(() => { calls++; });
  stale(); assert.equal(calls, 0); assert.equal(f.queue.size, 1);
  f.advance(640); assert.equal(calls, 1);
});
test('zero-delay work is cancellable before it runs', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(0, 'event'); f.task.resume(() => { calls++; });
  const stale = [...f.queue.values()][0].callback;
  f.task.configure(null, 'cancelled'); stale(); f.advance(0);
  assert.equal(f.queue.size, 0); assert.equal(calls, 0);
});
test('delay changes restart the deadline while repeated resume creates only one timer', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(1000, 'action'); f.task.resume(() => { calls++; });
  f.advance(500); f.task.configure(200, 'action');
  for (let i = 0; i < 10; i++) f.task.resume(() => { calls++; });
  assert.equal(f.queue.size, 1);
  f.advance(199); assert.equal(calls, 0); f.advance(1); assert.equal(calls, 1);
});
test('an elapsed callback rejected during a visibility change can resume once', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(100, 'completion'); f.task.resume(() => false);
  f.advance(100); f.task.pause(); f.task.resume(() => { calls++; });
  f.advance(0); assert.equal(calls, 1);
  f.task.pause(); f.task.resume(() => { calls++; }); f.advance(0);
  assert.equal(calls, 1);
});
test('cleanup and reconfiguration support an effect mount-cleanup-mount cycle', () => {
  const f = fixture(); let calls = 0;
  f.task.configure(750, 'star'); f.task.resume(() => { calls++; });
  f.task.cancel(); f.task.pause();
  f.task.configure(750, 'star'); f.task.resume(() => { calls++; });
  assert.equal(f.queue.size, 1); f.advance(750); assert.equal(calls, 1);
});
