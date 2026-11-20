import { Link } from 'react-router'
import { people } from '../data/people'
import styles from './OverviewPage.module.css'

const featuredIds = ['ada-lovelace', 'alan-turing', 'grace-hopper']
const featuredPeople = people.filter(({ id }) => featuredIds.includes(id))

export default function OverviewPage() {
  return (
    <div className={styles.page}>
      <h1>Pioneer Atlas</h1>
      <div className={styles.intro}>
        <p>
          Explore {people.length} computing pioneers, from early ideas for programmable machines
          to the languages and systems that shaped modern computing.
        </p>
      </div>

      <section aria-labelledby="featured-pioneers" className={styles.featured}>
        <h2 id="featured-pioneers">Featured pioneers</h2>
        <ul className={styles.grid} role="list">
          {featuredPeople.map(({ id, name, field, summary }) => {
            const initials = name.split(' ').map((word) => word.charAt(0)).join('')
            const headingId = 'featured-' + id

            return (
              <li key={id}>
                <Link to={'/people/' + id} aria-labelledby={headingId} className={styles.card}>
                  <div className={styles.identity}>
                    <span className={styles.avatar} aria-hidden="true">{initials}</span>
                    <div>
                      <h3 id={headingId}>{name}</h3>
                      <p className={styles.field}>{field}</p>
                    </div>
                  </div>
                  <p className={styles.summary}>{summary}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
