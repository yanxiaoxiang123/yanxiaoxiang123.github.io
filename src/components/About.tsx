import { about, research } from '@/data/content';
import AboutFlight, { type AboutChapter } from './AboutFlight';

/* The animated cards and the reader share the same complete chapter content. */
const chapters: AboutChapter[] = [
  {
    id: 'intro', label: about.intro.label, heading: about.intro.heading,
    body: <p className="fl-body">{about.intro.body}</p>,
  },
  {
    id: 'values', label: about.values.label, heading: about.values.heading,
    body: (
      <ul className="fl-list">
        {about.values.items.map((item) => (
          <li key={item.title}><b>{item.title}</b><span>{item.text}</span></li>
        ))}
      </ul>
    ),
  },
  {
    id: 'journey', label: about.timeline.label, heading: about.timeline.heading,
    body: (
      <ul className="fl-timeline">
        {about.timeline.items.map((item) => (
          <li key={item.date + item.title}>
            <span className="fl-date">{item.date}</span>
            <b>{item.title} · {item.place}</b>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'practice', label: '实践与实验', heading: '在应用之外',
    body: (
      <ul className="fl-list">
        {research.map((item) => (
          <li key={item.title}><b>{item.title}</b><span>{item.text}</span></li>
        ))}
      </ul>
    ),
  },
  {
    id: 'now', label: about.now.label, heading: about.now.heading,
    body: (
      <>
        <ul className="fl-now">
          {about.now.items.map((item) => (
            <li key={item.title}><b>{item.title}</b><span>{item.sub}</span></li>
          ))}
        </ul>
        <div className="todo-note">{about.now.todo}</div>
      </>
    ),
  },
];

/** Render chapter content on the server; the flight receives only content slots. */
export default function About() {
  return <AboutFlight chapters={chapters} />;
}
