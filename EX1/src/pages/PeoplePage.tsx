import { useState } from 'react'
import { Link } from 'react-router'
import { searchPeople } from '../data/people'
import styles from './PeoplePage.module.css'

export default function PeoplePage() {
  const [query, setQuery] = useState('')
  const visiblePeople = searchPeople(query)
  const hasResults = visiblePeople.length > 0

  return (
    <div className={styles.page}>
      <h1>People</h1>
      <label className={styles.search}>
        Search by name
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div>
        {hasResults && (
          <ul aria-label="Computing pioneers" className={styles.grid} role="list">
            {visiblePeople.map(({ id, name, era, field }) => {
              const initials = name.split(' ').map((word) => word.charAt(0)).join('')
              const headingId = 'directory-' + id

              return (
                <li key={id}>
                  <Link to={'/people/' + id} aria-labelledby={headingId} className={styles.card}>
                    <span className={styles.avatar} aria-hidden="true">{initials}</span>
                    <div>
                      <h2 id={headingId}>{name}</h2>
                      <p>{field}</p>
                      <p>{era}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <p className={styles.empty} role="status">
          {hasResults ? '' : 'No people match your search. Try a different name.'}
        </p>
      </div>
    </div>
  )
}
