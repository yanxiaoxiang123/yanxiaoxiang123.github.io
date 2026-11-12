'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { introLines, progressBlocks, progressStepMs } from '@/data/content';

type Row =
  | { type: 'cmd'; text: string; typed: string; cursor?: boolean }
  | { type: 'output'; prefix: string; text: string }
  | { type: 'gold'; prefix: string; text: string }
  | { type: 'blank' };

export default function Terminal({
  onLaunch,
  onReady,
}: {
  onLaunch: () => void;
  onReady?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [typingDone, setTypingDone] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [blocks, setBlocks] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const launched = useRef(false);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      const t = setTimeout(() => {
        setRows(
          introLines.map((l) =>
            l.type === 'cmd'
              ? { type: 'cmd' as const, text: l.text, typed: l.text }
              : l,
          ),
        );
        setTypingDone(true);
      }, 0);
      timers.current.push(t);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    const at = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.current.push(t);
    };

    let clock = 450;
    introLines.forEach((line) => {
      if (line.type === 'cmd') {
        const cmd = line.text;
        const start = clock;
        for (let i = 1; i <= cmd.length; i += 1) {
          at(start + i * 45, () => {
            setRows((prev) => {
              const next = prev.slice();
              const idx = next.findIndex(
                (r) => r.type === 'cmd' && r.text === cmd && r.typed.length < cmd.length,
              );
              const row: Row = { type: 'cmd', text: cmd, typed: cmd.slice(0, i) };
              if (idx === -1) next.push(row);
              else next[idx] = row;
              return next;
            });
          });
        }
        clock = start + cmd.length * 45 + 260;
      } else if (line.type === 'blank') {
        at(clock, () => setRows((prev) => [...prev, { type: 'blank' }]));
        clock += 90;
      } else if (line.type === 'output') {
        const row: Row = { type: 'output', prefix: line.prefix, text: line.text };
        at(clock, () => setRows((prev) => [...prev, row]));
        clock += 220;
      } else {
        const row: Row = { type: 'gold', prefix: line.prefix, text: line.text };
        at(clock, () => setRows((prev) => [...prev, row]));
        clock += 220;
      }
    });

    at(clock + 200, () => setTypingDone(true));

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const launch = useCallback(() => {
    if (launched.current || !typingDone) return;
    launched.current = true;
    setLaunching(true);
    setRows((prev) => [...prev, { type: 'output', prefix: '> ', text: 'launching...' }]);

    let b = 0;
    const tick = () => {
      b += 1;
      setBlocks(b);
      if (b >= progressBlocks) {
        setTimeout(onLaunch, 260);
        return;
      }
      timers.current.push(setTimeout(tick, progressStepMs));
    };
    timers.current.push(setTimeout(tick, 420));
  }, [onLaunch, typingDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') launch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [launch]);

  useEffect(() => {
    if (typingDone) onReady?.();
  }, [typingDone, onReady]);

  const progressPct = blocks <= 0 ? 0 : Math.round((blocks / progressBlocks) * 100);

  return (
    <div className="terminal" aria-label="终端介绍">
      <div className="terminal-titlebar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">yanxx@universe ~ zsh</span>
      </div>

      <div aria-live="polite">
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          if (row.type === 'blank') {
            return (
              <div key={i} className="term-line visible">
                &nbsp;
              </div>
            );
          }
          if (row.type === 'cmd') {
            return (
              <div key={i} className="term-line visible">
                <span className="term-prompt">$ </span>
                <span className="term-cmd">{row.typed}</span>
                {isLast && !launching ? <span className="cursor" /> : null}
              </div>
            );
          }
          if (row.type === 'gold') {
            return (
              <div key={i} className="term-line visible">
                <span className="term-gold">
                  {row.prefix}
                  {row.text}
                </span>
              </div>
            );
          }
          return (
            <div key={i} className="term-line visible">
              <span className="term-output">
                {row.prefix}
                {row.text}
              </span>
            </div>
          );
        })}

        {launching && blocks >= 0 ? (
          <div className="term-line visible">
            <span className="term-progress">
              [{'█'.repeat(blocks)}
              {'░'.repeat(progressBlocks - blocks)}] {progressPct}%
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
