import styles from './AboutPage.module.css'

export default function AboutPage() {
  return (
    <article className={styles.page}>
      <h1>About Pioneer Atlas</h1>

      <section aria-labelledby="about-purpose" className={styles.section}>
        <h2 id="about-purpose">Project purpose</h2>
        <p>
          Pioneer Atlas is an educational directory of people who shaped computing.
          Profile content is bundled locally, and searching runs in your browser.
        </p>
      </section>

      <section aria-labelledby="about-code-splitting" className={styles.section}>
        <h2 id="about-code-splitting">Code splitting</h2>
        <p>
          The demo is designed to load each route’s JavaScript on demand, so the initial
          download can omit code for unvisited pages. The design reserves space with a
          loading placeholder while the requested code arrives.
        </p>
      </section>

      <section aria-labelledby="about-performance" className={styles.section}>
        <h2 id="about-performance">Performance limitations</h2>
        <p>
          Cumulative Layout Shift (CLS) measures unexpected movement on the page.
          Lab measurements reflect the tested viewport and network conditions.
          CLS = 0 is a target. Results can vary across devices and visits.
        </p>
      </section>
    </article>
  )
}
