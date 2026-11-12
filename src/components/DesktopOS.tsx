'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { contact, home, profile, projects, research } from '@/data/content';

type WinId = 'about' | 'journey' | 'projects' | 'research' | 'sayhi';

type IconDef = {
  id: string;
  label: string;
  kind: 'folder' | 'file' | 'app';
  ext?: string;
  emoji?: string;
  x: number;
  y: number;
  win?: WinId;
  external?: string;
};

const ICONS: IconDef[] = [
  { id: 'about', label: '关于我.md', kind: 'file', ext: 'md', x: 32, y: 32, win: 'about' },
  { id: 'journey', label: '经历与教育', kind: 'folder', x: 32, y: 132, win: 'journey' },
  { id: 'projects', label: '项目文件夹', kind: 'folder', x: 32, y: 232, win: 'projects' },
  { id: 'research', label: '研究实验', kind: 'folder', x: 32, y: 332, win: 'research' },
  { id: 'sayhi', label: 'Say Hi.app', kind: 'app', emoji: '✉️', x: 132, y: 32, win: 'sayhi' },
  {
    id: 'github',
    label: 'github.com',
    kind: 'app',
    emoji: '🐙',
    x: 132,
    y: 132,
    external: profile.github,
  },
];

const STARS = [
  { x: '70%', y: '18%', size: 12, op: 0.6, dur: '3.2s', wdur: '4.4s', delay: '0s' },
  { x: '84%', y: '30%', size: 18, op: 0.5, dur: '4s', wdur: '5s', delay: '0.4s' },
  { x: '62%', y: '44%', size: 9, op: 0.8, dur: '2.6s', wdur: '3.6s', delay: '0.9s' },
  { x: '90%', y: '58%', size: 14, op: 0.45, dur: '3.6s', wdur: '4.8s', delay: '1.4s' },
  { x: '76%', y: '72%', size: 11, op: 0.65, dur: '3s', wdur: '4.2s', delay: '0.2s' },
  { x: '50%', y: '26%', size: 8, op: 0.7, dur: '2.8s', wdur: '4s', delay: '1.1s' },
  { x: '57%', y: '82%', size: 13, op: 0.5, dur: '3.4s', wdur: '5.2s', delay: '0.6s' },
  { x: '94%', y: '12%', size: 10, op: 0.6, dur: '2.9s', wdur: '3.8s', delay: '1.7s' },
];

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
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span className="mb-clock">{time || '--:--'}</span>;
}

function Window({
  title,
  onClose,
  children,
  initial = { x: 320, y: 80 },
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initial?: { x: number; y: number };
}) {
  const [pos, setPos] = useState(initial);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const x = Math.max(8, Math.min(window.innerWidth - 200, e.clientX - drag.current.dx));
    const y = Math.max(36, Math.min(window.innerHeight - 80, e.clientY - drag.current.dy));
    setPos({ x, y });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="os-window" style={{ left: pos.x, top: pos.y }} role="dialog" aria-label={title}>
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
          onClick={onClose}
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

export default function DesktopOS({ onGoWorks }: { onGoWorks: () => void }) {
  const [open, setOpen] = useState<WinId | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const surface = useRef<HTMLDivElement>(null);

  const burst = (e: React.MouseEvent) => {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 700);
  };

  const iconClick = (icon: IconDef) => {
    if (icon.external) {
      window.open(icon.external, '_blank', 'noopener');
      return;
    }
    if (icon.win) setOpen(icon.win);
  };

  const windows = useMemo<Record<WinId, React.ReactNode>>(
    () => ({
      about: (
        <>
          <div className="win-title">关于我.md</div>
          <div className="win-sub"># 晏晓翔 · Yan Xiaoxiang</div>
          <p className="win-body-text">
            常州大学计算机硕士在读，探索数据、算法与可用的系统。我的经历横跨数据处理、算法研究、系统开发与交付，
            习惯和 AI Agent 搭档，从需求一路做到能上线的形态。
          </p>
          <p className="win-body-text">
            比起给自己一个单一的标签，我更希望通过做过的事，让你认识我。
          </p>
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
            {home.timeline.items
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
          <div className="win-links" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="win-link-btn"
              onClick={onGoWorks}
              style={{
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                padding: '9px 18px',
                fontFamily: 'var(--mono)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
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
          <p className="win-body-text">
            关于项目、研究或工作机会，欢迎写信，或到 GitHub 找我。
          </p>
          <div className="win-links">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={contact.github} target="_blank" rel="noreferrer noopener">
              github.com/yanxiaoxiang123
            </a>
          </div>
          <p style={{ color: 'var(--ink-faint)', marginTop: 22, fontSize: 12, fontStyle: 'italic' }}>
            {contact.quote}
          </p>
        </>
      ),
    }),
    [onGoWorks],
  );

  return (
    <div className="desktop">
      <div className="desktop-menubar">
        <span className="mb-logo">yanxx</span>
        <span className="mb-item">我的OS</span>
        <span className="mb-item">项目</span>
        <span className="mb-item">联系</span>
        <Clock />
      </div>
      <div className="desktop-surface" ref={surface} onClick={burst}>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="wp-star"
            style={
              {
                left: s.x,
                top: s.y,
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
              style={{ left: icon.x, top: icon.y }}
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

        <div className="desktop-sticker" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/sticker.png" alt="" />
        </div>

        {open ? (
          <Window title={open} onClose={() => setOpen(null)}>
            {windows[open]}
          </Window>
        ) : null}

        <div className="scroll-on-hint">
          点开图标，看看里面
        </div>
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
