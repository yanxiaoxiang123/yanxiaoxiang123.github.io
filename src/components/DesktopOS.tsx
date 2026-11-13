'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { desktopMenu } from '@/data/navigation';
import type { WinId, DesktopContent, RepositoryIcon } from '@/lib/desktop-content';
import Xiaojing, { type PetEvent, type PetEventKind } from './Xiaojing';
import { usePausableTimeout } from '@/hooks/usePausableTimeout';
import DesktopIcon from './DesktopIcon';
import DesktopWindow from './DesktopWindow';

type IconDef = {
  id: string;
  label: string;
  icon: string;
  win: WinId;
};

const ICONS: IconDef[] = [
  { id: 'about', label: '关于我', icon: 'about', win: 'about' },
  { id: 'journey', label: '经历与教育', icon: 'journey', win: 'journey' },
  { id: 'projects', label: '项目文件夹', icon: 'projects', win: 'projects' },
  { id: 'research', label: '研究实验', icon: 'research', win: 'research' },
  { id: 'backing', label: 'Backing', icon: 'backing', win: 'backing' },
  { id: 'patent', label: '专利审核', icon: 'patent', win: 'patent' },
  { id: 'logistics', label: '货量预测', icon: 'logistics', win: 'logistics' },
  { id: 'sayhi', label: 'Say Hi', icon: 'sayhi', win: 'sayhi' },
];

/* Deterministic star field so server and client agree. */
function makeStars(count: number) {
  let seed = 20261112;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const size = 8 + Math.round(rand() * 12);
    return {
      left: `${4 + rand() * 88}%`,
      top: `${4 + rand() * 88}%`,
      size,
      op: 0.25 + rand() * 0.55,
      dur: `${2.4 + rand() * 2.6}s`,
      wdur: `${3.4 + rand() * 3}s`,
      delay: `${rand() * 3}s`,
    };
  });
}

const STARS = makeStars(46);
// Match the CSS media query, including when scrollbars narrow the surface.
const compactQuery = '(max-width: 768px)';
const compactViewport = () => window.matchMedia(compactQuery).matches;
const compactServerSnapshot = () => true;
const subscribeCompact = (notify: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

function Clock({ running }: { running: boolean }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      );
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [running]);
  return <span className="mb-clock">{time || '--:--'}</span>;
}

export default function DesktopOS({ onGoWorks, running, reducedMotion, content, repositories }: {
  onGoWorks: () => void; running: boolean; reducedMotion: boolean;
  content: DesktopContent; repositories: RepositoryIcon[];
}) {
  const [wins, setWins] = useState<
    { key: string; id: WinId; repo?: string; x: number; y: number; z: number }[]
  >([]);
  const zRef = useRef(100);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [petEvent, setPetEvent] = useState<PetEvent | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [surfaceVisible, setSurfaceVisible] = useState(false);
  const desktopActive = running && surfaceVisible;
  const decorationRunning = desktopActive && !reducedMotion;
  const compact = useSyncExternalStore(subscribeCompact, compactViewport, compactServerSnapshot);
  const starCount = compact ? 16 : 46;

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    // Keep observing while paused so returning to the surface can wake the pet.
    const observer = new IntersectionObserver(([entry]) => {
      setSurfaceVisible(entry.isIntersecting && entry.intersectionRatio >= 0.01);
    }, { threshold: 0.01 });
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!running || !el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [running]);

  /* Default desktop layout: three columns hugging the right edge. */
  const layout = useMemo(() => {
    const mobile = size.w > 0 && size.w <= 768;
    const right = mobile ? 8 : 26;
    const top0 = mobile ? 12 : 24;
    const gapX = mobile ? 4 : 6;
    const appW = mobile ? 60 : 72;
    const appRow = mobile ? 88 : 96;
    const out: { id: string; x: number; y: number }[] = [];

    const groupW = 4 * appW + 3 * gapX;
    ICONS.forEach((icon, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      out.push({
        id: icon.id,
        x: Math.max(0, size.w - right - groupW + col * (appW + gapX)),
        y: top0 + row * appRow,
      });
    });

    /* repository files: same four columns, under the apps */
    const repoW = mobile ? 60 : 72;
    const repoRow = mobile ? 74 : 80;
    const rows = Math.ceil(ICONS.length / 4);
    const startY = top0 + rows * appRow + (mobile ? 12 : 24);
    const repoGroupW = 4 * repoW + 3 * gapX;
    repositories.forEach((r, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      out.push({
        id: 'repo:' + r.name,
        x: Math.max(0, size.w - right - repoGroupW + col * (repoW + gapX)),
        y: startY + row * repoRow,
      });
    });

    return out;
  }, [size.w, repositories]);

  const posOf = (id: string) => {
    const l = layout.find((p) => p.id === id);
    return l ? { x: l.x, y: l.y } : { x: 0, y: 0 };
  };

  const eventSeq = useRef(0);
  const tellPet = useCallback((kind: PetEventKind) => {
    eventSeq.current += 1;
    setPetEvent({ kind, at: eventSeq.current });
  }, []);

  // Discard transient decoration with the permission change, before it can replay.
  if (!decorationRunning && bursts.length) setBursts([]);
  usePausableTimeout(() => setBursts([]), bursts.length ? 750 : null,
    decorationRunning, bursts.at(-1)?.id ?? 'no-bursts');
  const burst = (e: React.MouseEvent) => {
    if (!decorationRunning) return;
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev.slice(-5), { id, x: e.clientX, y: e.clientY }]);
  };

  const openWindow = useCallback(
    (id: WinId, repo?: string) => {
      const key = repo ? `${id}:${repo}` : id;
      zRef.current += 1;
      const z = zRef.current;
      tellPet('open');
      setWins((prev) => {
        const found = prev.find((w) => w.key === key);
        if (found) return prev.map((w) => (w.key === key ? { ...w, z } : w));
        const n = prev.length;
        return [
          ...prev,
          {
            key,
            id,
            repo,
            z,
            x: window.innerWidth <= 768 ? window.innerWidth * 0.04
              : Math.max(24, Math.min(190 + n * 44, window.innerWidth - 560)),
            y: window.innerWidth <= 768 ? 104 : Math.max(48, 66 + n * 34),
          },
        ];
      });
    },
    [tellPet],
  );

  const openWin = (id: WinId) => openWindow(id);
  const openRepo = (name: string) => openWindow('repo', name);

  const closeWin = (key: string) => {
    setWins((prev) => prev.filter((w) => w.key !== key));
    tellPet('close');
  };
  const focusWin = (key: string) => {
    zRef.current += 1;
    const z = zRef.current;
    setWins((prev) => prev.map((w) => (w.key === key ? { ...w, z } : w)));
  };


  return (
    <div className="desktop" data-motion={decorationRunning}>
      <div className="desktop-menubar">
        <span className="mb-logo">yanxx OS</span>
        {desktopMenu.map((m) => (
          <span className="mb-item" key={m}>
            {m}
          </span>
        ))}
        <Clock running={desktopActive} />
      </div>

      <div className="desktop-surface" ref={surfaceRef} onClick={burst}>
        {STARS.slice(0, starCount).map((s, i) => (
          <span
            key={i}
            className="wp-star"
            style={
              {
                left: s.left,
                top: s.top,
                '--size': `${s.size}px`,
                '--op': s.op,
                '--dur': s.dur,
                '--wdur': s.wdur,
                '--delay': s.delay,
              } as React.CSSProperties
            }
            aria-hidden="true"
          >
            ✦
          </span>
        ))}

        <div className="desktop-icons">
          {ICONS.map(icon => (
            <DesktopIcon key={icon.id} id={icon.id} label={icon.label}
              image={`/images/apps/${icon.icon}.png`} initial={posOf(icon.id)} area={size}
              running={running} onOpen={() => openWin(icon.win)} onEvent={tellPet} />
          ))}
          {repositories.map(repo => (
            <DesktopIcon key={`repo:${repo.name}`} id={`repo:${repo.name}`} label={repo.name}
              image={`/images/repos/${repo.icon}.png`} repository initial={posOf(`repo:${repo.name}`)}
              area={size} running={running} onOpen={() => openRepo(repo.name)} onEvent={tellPet} />
          ))}
        </div>

        <Xiaojing area={size} event={petEvent} running={desktopActive} reducedMotion={reducedMotion} />

        {wins.map((w) => (
          <DesktopWindow
            key={w.key}
            running={running}
            id={w.id}
            title={w.repo ?? w.id}
            initial={{ x: w.x, y: w.y }}
            z={w.z}
            onClose={() => closeWin(w.key)}
            onFocus={() => focusWin(w.key)}
          >
            {content[w.key] ?? null}
            {w.id === 'projects' && (
              <div className="win-links" style={{ marginTop: 18 }}>
                <button type="button" className="win-link" onClick={onGoWorks}>打开项目页 →</button>
              </div>
            )}
          </DesktopWindow>
        ))}

        <div className="scroll-on-hint">向下滑动，和这里说再见</div>
      </div>

      {decorationRunning && bursts.map((b) => (
        <span
          key={b.id}
          className="click-star"
          style={{ left: b.x - 10, top: b.y - 10, fontSize: 20 }}
          aria-hidden="true"
        >
          ✦
        </span>
      ))}
    </div>
  );
}
