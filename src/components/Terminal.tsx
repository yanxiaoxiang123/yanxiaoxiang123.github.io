'use client';

import { useEffect, useRef, useState } from 'react';
import { introLines, progressBlocks, progressStepMs } from '@/data/intro';
import type { StartupPhase } from '@/lib/portfolio-state';
import { usePausableTimeout } from '@/hooks/usePausableTimeout';

type Row =
  | { type: 'cmd'; text: string; typed: string }
  | { type: 'output'; prefix: string; text: string }
  | { type: 'gold'; prefix: string; text: string }
  | { type: 'blank' };

const completeRows: Row[] = introLines.map(line => line.type === 'cmd' ? { ...line, typed: line.text } : line);
// One timeline and one pending tick, rather than a timeout for every character.
const frames: { at: number; rows: Row[] }[] = [{ at: 0, rows: [] }];
let clock = 620;
let timelineRows: Row[] = [];
for (const line of introLines) {
  if (line.type === 'cmd') {
    const previous = timelineRows;
    for (let i = 1; i <= line.text.length; i++) {
      frames.push({ at: clock + i * 62,
        rows: [...previous, { ...line, typed: line.text.slice(0, i) }] });
    }
    timelineRows = [...previous, { ...line, typed: line.text }];
    clock += line.text.length * 62 + 340;
  } else {
    timelineRows = [...timelineRows, line];
    frames.push({ at: clock, rows: timelineRows });
    clock += line.type === 'blank' ? 130 : 300;
  }
}
frames.push({ at: clock + 200, rows: completeRows });

export default function Terminal({ phase, running, enhanced, reducedMotion, onLaunch, onReady, onBooted }: {
  phase: StartupPhase;
  running: boolean;
  enhanced: boolean;
  reducedMotion: boolean;
  onLaunch: () => void;
  onReady: () => void;
  onBooted: () => void;
}) {
  const [frame, setFrame] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const typing = phase === 'intro' && !reducedMotion;
  const next = frames[frame + 1];
  const done = reducedMotion || !next;

  usePausableTimeout(() => setFrame(i => i + 1), typing && next ? next.at - frames[frame].at : null,
    running, `typing:${frame}`);
  usePausableTimeout(onReady, phase === 'intro' && done ? 0 : null, running, 'intro-ready');
  usePausableTimeout(() => {
    if (blocks === progressBlocks) onBooted();
    else setBlocks(b => b + 1);
  }, phase !== 'booting' ? null : reducedMotion ? 0
    : blocks === progressBlocks ? 260 : blocks === 0 ? 420 : progressStepMs,
  running, `boot:${blocks}`);

  useEffect(() => {
    if (!running || phase !== 'ready') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.defaultPrevented) return;
      if (!terminalRef.current?.getClientRects().length) return;
      if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, dialog, [contenteditable]')) return;
      onLaunch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, phase, onLaunch]);

  const rows = !enhanced || !typing ? completeRows : frames[frame].rows;
  const launching = ['booting', 'zooming', 'covered'].includes(phase);
  const progressPct = Math.round((blocks / progressBlocks) * 100);
  return (
    <div className={`terminal${phase === 'zooming' || phase === 'covered' ? ' scale-through' : ''}`}
      ref={terminalRef} aria-label="终端介绍">
      <div className="terminal-titlebar">
        <span className="terminal-dot red" /><span className="terminal-dot yellow" /><span className="terminal-dot green" />
        <span className="terminal-title">yanxx@universe ~ zsh</span>
      </div>
      <div aria-live={running ? 'polite' : 'off'}>
        {rows.map((row, i) => {
          if (row.type === 'blank') return <div key={i} className="term-line visible">&nbsp;</div>;
          if (row.type === 'cmd') return (
            <div key={i} className="term-line visible">
              <span className="term-prompt">$ </span><span className="term-cmd">{row.typed}</span>
              {i === rows.length - 1 && !launching ? <span className="cursor" /> : null}
            </div>
          );
          return (
            <div key={i} className="term-line visible">
              <span className={row.type === 'gold' ? 'term-gold' : 'term-output'}>{row.prefix}{row.text}</span>
            </div>
          );
        })}
        {launching && <>
          <div className="term-line visible"><span className="term-output">&gt; launching...</span></div>
          <div className="term-line visible"><span className="term-progress">
            [{'█'.repeat(blocks)}{'░'.repeat(progressBlocks - blocks)}] {progressPct}%
          </span></div>
        </>}
      </div>
    </div>
  );
}
