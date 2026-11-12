import { projects, toolkit, vibeCards } from '@/data/content';

const WASH: Record<string, string> = {
  blue: 'rgba(43, 127, 216, 0.26)',
  yellow: 'rgba(244, 215, 88, 0.42)',
  red: 'rgba(232, 74, 95, 0.22)',
};

export default function Works() {
  return (
    <div className="works-page" id="works-top">
      <header className="works-head">
        <div className="section-label">~/projects</div>
        <h1 className="works-heading">精选项目</h1>
        <p className="works-sub">
          三个从想法走到可用形态的系统，工程、数据与模型各自承担一部分。
        </p>
      </header>

      {/* Featured Projects */}
      <section className="fx-list" aria-label="精选项目">
        {projects.map((p, i) => (
          <article
            className={`fx-card fx-${p.accent}`}
            key={p.slug}
            style={
              {
                '--wash': WASH[p.accent],
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            <div className="fx-text">
              <div className="fx-meta">
                {p.icon} {p.role} · {p.period}
              </div>
              <h2 className="fx-title">{p.title}</h2>
              <p className="fx-blurb">{p.summary}</p>
              <div className="fx-tags">
                {p.stack.split(' · ').map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>

            <div className="fx-shot" aria-hidden="true">
              <div className="fx-poster">
                <div className="fx-poster-top">{p.subtitle}</div>
                <div className="fx-stats">
                  {p.stats.map(([value, label]) => (
                    <div key={label}>
                      <b>{value}</b>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="fx-graph">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Vibe Coding */}
      <section className="vibe" aria-label="Vibe Coding">
        <div className="works-head">
          <div className="section-label">~/vibe-coding</div>
          <h2 className="works-heading sm">Vibe Coding</h2>
          <p className="works-sub">和 Agent 一起，把想法写成能跑的东西。</p>
        </div>

        <div className="vibe-board">
          {vibeCards.map((c, i) => (
            <div
              className="vibe-slot"
              key={c.title}
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="vibe-card" style={{ '--r': `${c.r}deg` } as React.CSSProperties}>
                <span className="vc-emoji">{c.emoji}</span>
                <b>{c.title}</b>
                <span className="vc-note">{c.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* My Design Toolkit */}
      <section className="tk" aria-label="My Design Toolkit">
        <div className="works-head">
          <div className="section-label">~/toolkit</div>
          <h2 className="works-heading sm">My Design Toolkit</h2>
          <p className="works-sub">
            自己的拼贴与照片——鼠标放上去（或 Tab 聚焦），它们会从卡片里跳出来。
          </p>
        </div>

        <div className="tk-grid">
          {toolkit.map((t, i) => (
            <div
              className="tk-card"
              key={t.title}
              tabIndex={0}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="tk-fold">
                <div className="tk-back" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="tk-photo" src={t.src} alt={t.title} loading="lazy" />
                <div className="tk-front">
                  <span className="tk-mark">✦</span>
                  <b>{t.title}</b>
                  <span className="tk-meta">{t.meta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
