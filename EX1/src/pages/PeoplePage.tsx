import { useState } from 'react'
import { Link, useMatch } from 'react-router'
import { searchPeople } from '../data/people'
import styles from './PeoplePage.module.css'

type PeoplePageProps = {
  variant?: 'full' | 'compact'
}

export default function PeoplePage({ variant = 'full' }: PeoplePageProps) {
  const [query, setQuery] = useState('')
  const selectedId = useMatch('/people/:personId')?.params.personId
  const visiblePeople = searchPeople(query)
  const hasResults = visiblePeople.length > 0
  const compact = variant === 'compact'
  const DirectoryHeading = compact ? 'h2' : 'h1'
  const CardHeading = compact ? 'h3' : 'h2'

  return (
    <div className={compact ? styles.page + ' ' + styles.compact : styles.page}>
      <DirectoryHeading>People</DirectoryHeading>
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
                  <Link
                    to={'/people/' + id}
                    aria-labelledby={headingId}
                    aria-current={selectedId === id ? 'page' : undefined}
                    className={styles.card}
                  >
                    <span className={styles.avatar} aria-hidden="true">{initials}</span>
                    <div>
                      <CardHeading id={headingId}>{name}</CardHeading>
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
