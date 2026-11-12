'use client';

import { useEffect, useRef } from 'react';
import { contactInfo, goodbye } from '@/data/content';

/**
 * Scroll-driven exit: the desktop screen starts filling the viewport and
 * shrinks back into a laptop while the goodbye terminal fades in.
 * Mirrors the reference site's exit-section behaviour.
 */
export default function ExitSection({ onRestart }: { onRestart: () => void }) {
  const section = useRef<HTMLElement>(null);
  const mac = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const update = () => {
      ticking.current = false;
      const s = section.current;
      const m = mac.current;
      const g = screen.current;
      if (!s || !m || !g) return;

      const rect = s.getBoundingClientRect();
      const total = s.offsetHeight;
      const vh = window.innerHeight;
      const scrolled = -rect.top;
      const range = total - vh;
      if (range <= 0) return;

      const a = Math.max(0, Math.min(1, scrolled / range));
      const o = ease(Math.min(1, a / 0.5));

      const mobile = window.innerWidth <= 768;
      const sw = mobile ? 322 : 680;
      const sh = mobile ? 250 : 440;
      const full = Math.max(window.innerWidth / sw, vh / sh) * 1.05;
      const scale = full - (full - 1) * o;

      m.style.transform = `scale(${scale})`;
      m.style.opacity = '1';

      if (a >= 0.3) {
        const l = Math.min(1, (a - 0.3) / 0.3);
        g.classList.add('visible');
        g.style.opacity = String(ease(l));
      } else {
        g.classList.remove('visible');
        g.style.opacity = '0';
      }
      if (a >= 0.6) {
        m.style.transform = 'scale(1)';
        g.style.opacity = '1';
        g.classList.add('visible');
      }
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className="exit-section" ref={section}>
      <div className="exit-sticky">
        <div className="exit-macbook-wrapper" ref={mac}>
          <div className="exit-bezel">
            <div className="exit-notch" />
            <div className="exit-screen">
              <div className="goodbye-screen" ref={screen}>
                <div className="goodbye-titlebar">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span className="goodbye-title-text">yanxx@universe ~ zsh</span>
                </div>
                <div className="goodbye-body">
                  <div className="goodbye-terminal">
                    {goodbye.lines.map((line) => (
                      <div key={line.cmd}>
                        <div className="gt-line">
                          <span className="gt-prompt">$ </span>
                          <span className="gt-cmd">{line.cmd}</span>
                        </div>
                        {line.cmd === 'cat contact.md' ? (
                          <>
                            <div className="gt-line gt-output">
                              <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                            </div>
                            <div className="gt-line gt-output">
                              <a href={contactInfo.github} target="_blank" rel="noreferrer noopener">
                                github.com/yanxiaoxiang123
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className={`gt-line ${line.gold ? '' : 'gt-output'}`}>
                            {line.gold ? (
                              <span className="gt-gold">{line.out}</span>
                            ) : (
                              line.out
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="goodbye-footer">
                  {goodbye.footer}
                  <button type="button" className="goodbye-back" onClick={onRestart}>
                    {goodbye.back}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="exit-hinge" />
          <div className="exit-base" />
          <div className="exit-shadow" />
        </div>
      </div>
    </section>
  );
}
