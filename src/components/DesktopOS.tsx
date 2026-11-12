'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { about, contactInfo, desktopMenu, profile, projects, research } from '@/data/content';

type WinId =
  | 'about'
  | 'journey'
  | 'projects'
  | 'research'
  | 'sayhi'
  | 'backing'
  | 'patent'
  | 'logistics';

type IconDef = {
  id: string;
  label: string;
  kind: 'folder' | 'file' | 'app';
  ext?: string;
  emoji?: string;
  win?: WinId;
  external?: string;
};

const ICONS: IconDef[] = [
  { id: 'about', label: '关于我.md', kind: 'file', ext: 'md', win: 'about' },
  { id: 'journey', label: '经历与教育', kind: 'folder', win: 'journey' },
  { id: 'projects', label: '项目文件夹', kind: 'folder', win: 'projects' },
  { id: 'research', label: '研究实验', kind: 'folder', win: 'research' },
  { id: 'backing', label: 'Backing', kind: 'app', emoji: '📈', win: 'backing' },
  { id: 'patent', label: '专利审核', kind: 'app', emoji: '📄', win: 'patent' },
  { id: 'logistics', label: '货量预测', kind: 'app', emoji: '📦', win: 'logistics' },
  { id: 'sayhi', label: 'Say Hi.app', kind: 'app', emoji: '✉️', win: 'sayhi' },
  {
    id: 'github',
    label: 'github.com',
    kind: 'app',
    emoji: '🐙',
    external: profile.github,
  },
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

function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      );
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return <span className="mb-clock">{time || '--:--'}</span>;
}

function Window({
  id,
  title,
  initial,
  z,
  onClose,
  onFocus,
  children,
}: {
  id: WinId;
  title: string;
  initial: { x: number; y: number };
  z: number;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onFocus();
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const w = Math.min(520, window.innerWidth * 0.92);
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - drag.current.dx));
    const y = Math.max(36, Math.min(window.innerHeight - 90, e.clientY - drag.current.dy));
    setPos({ x, y });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      className="os-window"
      style={{ left: pos.x, top: pos.y, zIndex: z }}
      role="dialog"
      aria-label={title}
      data-win={id}
      onPointerDown={onFocus}
    >
      <div
        className="os-dragbar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      <div className="os-traffic">
        <span
          className="tl-close"
          role="button"
          tabIndex={0}
          aria-label="关闭"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClose();
          }}
        />
        <span className="tl-min" />
        <span className="tl-max" />
      </div>
      <div className="os-body">{children}</div>
    </div>
  );
}

function ProjectWindow({ slug }: { slug: string }) {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return null;
  return (
    <>
      <div className="win-title">{p.title}</div>
      <div className="win-sub">
        {p.role} · {p.period}
      </div>
      <p className="win-body-text">{p.summary}</p>
      <div className="win-sub" style={{ marginBottom: 8 }}>
        {p.stack}
      </div>
      <ul className="win-list">
        {p.points.map((pt) => (
          <li key={pt}>{pt}</li>
        ))}
      </ul>
    </>
  );
}

export default function DesktopOS({ onGoWorks }: { onGoWorks: () => void }) {
  const [wins, setWins] = useState<{ id: WinId; x: number; y: number; z: number }[]>([]);
  const zRef = useRef(100);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const sticker = useRef<HTMLDivElement>(null);

  const burst = (e: React.MouseEvent) => {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 750);
  };

  const openWin = useCallback((id: WinId) => {
    zRef.current += 1;
    const z = zRef.current;
    setWins((prev) => {
      const found = prev.find((w) => w.id === id);
      if (found) return prev.map((w) => (w.id === id ? { ...w, z } : w));
      const n = prev.length;
      return [
        ...prev,
        {
          id,
          z,
          x: Math.max(24, Math.min(190 + n * 44, window.innerWidth - 560)),
          y: Math.max(48, 66 + n * 34),
        },
      ];
    });
  }, []);

  const closeWin = (id: WinId) => setWins((prev) => prev.filter((w) => w.id !== id));
  const focusWin = (id: WinId) => {
    zRef.current += 1;
    const z = zRef.current;
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, z } : w)));
  };

  const iconClick = (icon: IconDef) => {
    if (icon.external) {
      window.open(icon.external, '_blank', 'noopener');
      return;
    }
    if (icon.win) openWin(icon.win);
  };

  /* draggable sticker */
  const stickerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = sticker.current;
    if (!el) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement!.getBoundingClientRect();
    const left = rect.left - parent.left;
    const top = rect.top - parent.top;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    const move = (ev: PointerEvent) => {
      el.style.left = `${Math.max(0, Math.min(parent.width - rect.width, left + ev.clientX - startX))}px`;
      el.style.top = `${Math.max(0, Math.min(parent.height - rect.height, top + ev.clientY - startY))}px`;
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  const content = useMemo<Record<WinId, React.ReactNode>>(
    () => ({
      about: (
        <>
          <div className="win-title">关于我.md</div>
          <div className="win-sub"># 晏晓翔 · Yan Xiaoxiang</div>
          <p className="win-body-text">
            常州大学计算机硕士在读，探索数据、算法与可用的系统。我的经历横跨数据处理、算法研究、系统开发与交付，
            习惯和 AI Agent 搭档，从需求一路做到能上线的形态。
          </p>
          <p className="win-body-text">比起给自己一个单一的标签，我更希望通过做过的事，让你认识我。</p>
          <div className="win-links">
            <a href={`mailto:${profile.email}`}>发送邮件</a>
            <a href={profile.github} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </div>
        </>
      ),
      journey: (
        <>
          <div className="win-title">经历与教育</div>
          <div className="win-sub">~/journey</div>
          <div className="turning-points">
            {about.timeline.items
              .slice()
              .reverse()
              .map((item) => (
                <div className="tp-item" key={item.date + item.title}>
                  <div className="tp-date">{item.date}</div>
                  <div className="tp-title">
                    {item.title} · {item.place}
                  </div>
                  <div className="tp-desc">{item.text}</div>
                </div>
              ))}
          </div>
        </>
      ),
      projects: (
        <>
          <div className="win-title">项目文件夹</div>
          <div className="win-sub">~/works · {projects.length} 个精选项目</div>
          <div className="folder-grid">
            {projects.map((p) => (
              <div className="folder-row" key={p.slug}>
                <div>
                  {p.icon} {p.title}
                </div>
                <div className="fr-sub">{p.subtitle}</div>
              </div>
            ))}
          </div>
          <div className="win-links" style={{ marginTop: 18 }}>
            <button type="button" className="win-link" onClick={onGoWorks}>
              打开项目页 →
            </button>
          </div>
        </>
      ),
      research: (
        <>
          <div className="win-title">研究实验</div>
          <div className="win-sub">~/practice</div>
          <div className="folder-grid">
            {research.map((r) => (
              <div className="folder-row" key={r.title}>
                <a href={r.url} target="_blank" rel="noreferrer noopener">
                  🔬 {r.title}
                </a>
                <div className="fr-sub">{r.text}</div>
              </div>
            ))}
          </div>
        </>
      ),
      sayhi: (
        <>
          <div className="win-title">Say Hi</div>
          <div className="win-sub">{'// 聊聊新的可能'}</div>
          <p className="win-body-text">关于项目、研究或工作机会，欢迎写信，或到 GitHub 找我。</p>
          <div className="win-links">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.github} target="_blank" rel="noreferrer noopener">
              github.com/yanxiaoxiang123
            </a>
          </div>
          <p style={{ color: 'var(--ink-faint)', marginTop: 22, fontSize: 12, fontStyle: 'italic' }}>
            {contactInfo.quote}
          </p>
        </>
      ),
      backing: <ProjectWindow slug="backing" />,
      patent: <ProjectWindow slug="patent" />,
      logistics: <ProjectWindow slug="logistics" />,
    }),
    [onGoWorks],
  );

  return (
    <div className="desktop">
      <div className="desktop-menubar">
        <span className="mb-logo">yanxx OS</span>
        {desktopMenu.map((m) => (
          <span className="mb-item" key={m}>
            {m}
          </span>
        ))}
        <Clock />
      </div>

      <div className="desktop-surface" onClick={burst}>
        {STARS.map((s, i) => (
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
          {ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className="dicon"
              onClick={(e) => {
                e.stopPropagation();
                iconClick(icon);
              }}
            >
              <span
                className={`dicon-art ${icon.kind}${icon.ext ? ` ext-${icon.ext}` : ''}`}
                data-ext={icon.ext ? icon.ext.toUpperCase() : undefined}
              >
                {icon.emoji ? <span className="app-emoji">{icon.emoji}</span> : null}
              </span>
              <span className="dicon-label">{icon.label}</span>
            </button>
          ))}
        </div>

        <div className="desktop-sticker" ref={sticker} onPointerDown={stickerDown}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/sticker.png" alt="手绘贴纸：机器人坐在纸飞机上" draggable={false} />
        </div>

        {wins.map((w) => (
          <Window
            key={w.id}
            id={w.id}
            title={w.id}
            initial={{ x: w.x, y: w.y }}
            z={w.z}
            onClose={() => closeWin(w.id)}
            onFocus={() => focusWin(w.id)}
          >
            {content[w.id]}
          </Window>
        ))}

        <div className="scroll-on-hint">向下滑动，和这里说再见</div>
      </div>

      {bursts.map((b) => (
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
