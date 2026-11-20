import { Link, useParams } from 'react-router'
import { getPersonById } from '../data/people'
import styles from './PersonPage.module.css'

export default function PersonPage() {
  const { personId } = useParams<'personId'>()
  const person = personId ? getPersonById(personId) : undefined

  return (
    <article className={styles.page}>
      <Link to="/people" className={styles.returnLink}>Back to people directory</Link>

      {person ? (
        <>
          <header className={styles.heading}>
            <span className={styles.avatar} aria-hidden="true">
              {person.name.split(' ').map((word) => word.charAt(0)).join('')}
            </span>
            <h1>{person.name}</h1>
          </header>

          <dl className={styles.metadata}>
            <div>
              <dt>Era</dt>
              <dd>{person.era}</dd>
            </div>
            <div>
              <dt>Field</dt>
              <dd>{person.field}</dd>
            </div>
          </dl>

          <section aria-labelledby="person-biography" className={styles.section}>
            <h2 id="person-biography">Biography</h2>
            <p className={styles.prose}>{person.summary}</p>
          </section>

          <section aria-labelledby="person-contributions" className={styles.section}>
            <h2 id="person-contributions">Contributions</h2>
            <ul className={styles.contributions}>
              {person.contributions.map((contribution) => (
                <li key={contribution}>{contribution}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <div className={styles.missing}>
          <h1>Profile not found</h1>
          <p>We couldn’t find a profile for this link.</p>
        </div>
      )}
    </article>
  )
}
