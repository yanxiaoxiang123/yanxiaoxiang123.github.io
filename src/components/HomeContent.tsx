import { home, research } from '@/data/content';

export default function HomeContent() {
  return (
    <div className="home-content">
      <section className="home-section" id="intro">
        <div className="section-label">{home.intro.label}</div>
        <h2 className="section-heading">{home.intro.heading}</h2>
        <p className="intro-body">{home.intro.body}</p>
      </section>

      <section className="home-section" id="strengths">
        <div className="section-label">{home.values.label}</div>
        <h2 className="section-heading">{home.values.heading}</h2>
        <div className="value-list">
          {home.values.items.map((item) => (
            <div className="value-item" key={item.title}>
              <p>
                {item.title}：{item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section" id="journey">
        <div className="section-label">{home.timeline.label}</div>
        <h2 className="section-heading">{home.timeline.heading}</h2>
        <div className="turning-points">
          {home.timeline.items.map((item) => (
            <div className="tp-item" key={item.date + item.title}>
              <div className="tp-date">{item.date}</div>
              <div className="tp-title">
                {item.title} · {item.place}
              </div>
              <div className="tp-desc">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section" id="practice">
        <div className="section-label">实践与实验</div>
        <h2 className="section-heading">在应用之外</h2>
        <div className="value-list">
          {research.map((item) => (
            <div className="value-item" key={item.title}>
              <p>{item.title}</p>
              <p style={{ fontWeight: 400, fontSize: 14 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section" id="now">
        <div className="section-label">{home.now.label}</div>
        <h2 className="section-heading">{home.now.heading}</h2>
        <div className="now-list">
          {home.now.items.map((item, i) => (
            <div className="now-item" key={item.title}>
              <span className="now-num">{`0${i + 1}`}</span>
              <div className="now-text">{item.title}</div>
              <div className="now-sub">{item.sub}</div>
            </div>
          ))}
        </div>
        <div className="todo-note">{home.now.todo}</div>
      </section>
    </div>
  );
}
