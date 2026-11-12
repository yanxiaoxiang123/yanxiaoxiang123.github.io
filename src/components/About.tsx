import { about, research } from '@/data/content';

export default function About() {
  return (
    <div className="home-content">
      <section className="home-section" id="intro">
        <div className="section-label">{about.intro.label}</div>
        <h1 className="section-heading">{about.intro.heading}</h1>
        <p className="intro-body">{about.intro.body}</p>
      </section>

      <section className="home-section" id="strengths">
        <div className="section-label">{about.values.label}</div>
        <h2 className="section-heading">{about.values.heading}</h2>
        <div className="value-list">
          {about.values.items.map((item) => (
            <div className="value-item" key={item.title}>
              <p>
                {item.title}：{item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section" id="journey">
        <div className="section-label">{about.timeline.label}</div>
        <h2 className="section-heading">{about.timeline.heading}</h2>
        <div className="turning-points">
          {about.timeline.items.map((item) => (
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
        <div className="section-label">{about.now.label}</div>
        <h2 className="section-heading">{about.now.heading}</h2>
        <div className="now-list">
          {about.now.items.map((item, i) => (
            <div className="now-item" key={item.title}>
              <span className="now-num">{`0${i + 1}`}</span>
              <div className="now-text">{item.title}</div>
              <div className="now-sub">{item.sub}</div>
            </div>
          ))}
        </div>
        <div className="todo-note">{about.now.todo}</div>
      </section>
    </div>
  );
}
