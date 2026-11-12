'use client';

import { useEffect, useRef, useState } from 'react';
import { terminalLines } from '@/data/content';

type Revealed = { kind: 'prompt' | 'output' | 'gold'; text: string; typed?: string };

/**
 * Types the terminal lines one after another, like a real shell session.
 * Falls back to fully-revealed content when the user prefers reduced motion.
 */
export default function Terminal() {
  const [lines, setLines] = useState<Revealed[]>([]);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      const t = setTimeout(() => {
        setLines(terminalLines.map((l) => ({ kind: l.kind, text: 'text' in l ? l.text : l.cmd })));
        setDone(true);
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

    let clock = 600;
    terminalLines.forEach((line) => {
      if (line.kind === 'prompt') {
        const cmd = line.cmd;
        const start = clock;
        for (let i = 1; i <= cmd.length; i += 1) {
          at(start + i * 55, () => {
            setLines((prev) => {
              const next = prev.slice();
              const idx = next.findIndex(
                (x) => x.kind === 'prompt' && x.text === cmd && x.typed !== undefined,
              );
              const entry = { kind: 'prompt' as const, text: cmd, typed: cmd.slice(0, i) };
              if (idx === -1) next.push(entry);
              else next[idx] = entry;
              return next;
            });
          });
        }
        clock = start + cmd.length * 55 + 320;
      } else {
        const value = line.text;
        at(clock, () => {
          setLines((prev) => [...prev, { kind: line.kind, text: value }]);
        });
        clock += 260;
      }
    });

    at(clock + 300, () => setDone(true));

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div className="terminal" aria-label="终端介绍">
      <div className="terminal-titlebar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">yanxx — zsh</span>
      </div>
      <div aria-live="polite">
        {lines.map((line, i) => (
          <div key={i} className="term-line visible">
            {line.kind === 'prompt' ? (
              <>
                <span className="term-prompt">➜ </span>
                <span className="term-cmd">{line.typed}</span>
                {i === lines.length - 1 && !done ? <span className="cursor" /> : null}
              </>
            ) : line.kind === 'gold' ? (
              <span className="term-gold">{line.text}</span>
            ) : (
              <span className="term-output">{line.text}</span>
            )}
          </div>
        ))}
        {done ? (
          <div className="term-line visible">
            <span className="term-prompt">➜ </span>
            <span className="cursor" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
