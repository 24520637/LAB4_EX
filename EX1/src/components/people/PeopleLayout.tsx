import type { ReactNode } from 'react'
import { Outlet, useParams } from 'react-router'
import styles from './PeopleLayout.module.css'

type PeopleLayoutProps = {
  directory: ReactNode
}

export default function PeopleLayout({ directory }: PeopleLayoutProps) {
  const { personId } = useParams<'personId'>()

  return (
    <section
      aria-label="Pioneer directory and details"
      className={styles.layout}
      data-view={personId ? 'profile' : 'directory'}
    >
      <div className={styles.panels}>
        <section aria-label="Pioneer directory">{directory}</section>
        <section aria-label="Pioneer details">
          <Outlet />
        </section>
      </div>
    </section>
  )
}
