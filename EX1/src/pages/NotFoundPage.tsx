import { Link } from 'react-router'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <article className={styles.page}>
      <h1>404 Page not found</h1>
      <p>Check the address or choose a destination below.</p>
      <nav aria-label="Recovery" className={styles.recovery}>
        <Link to="/">Home</Link>
        <Link to="/people">People</Link>
      </nav>
    </article>
  )
}
