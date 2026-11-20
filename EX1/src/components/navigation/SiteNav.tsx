import { Link, useMatch } from 'react-router'

const styles = `
  .site-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin-block-start: 0.5rem;
  }

  .site-nav a {
    color: var(--color-text);
    padding-block: 0.25rem;
    text-decoration-color: transparent;
    text-underline-offset: 0.25em;
  }

  .site-nav a:hover,
  .site-nav a[aria-current="page"] {
    color: var(--color-accent);
    text-decoration-color: currentColor;
  }

  .site-nav a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

export default function SiteNav() {
  const overview = useMatch('/')
  const directory = useMatch('/people')
  const profile = useMatch('/people/:personId')
  const about = useMatch('/about')

  return (
    <nav aria-label="Primary" className="site-nav">
      <style href="pioneer-atlas-site-nav" precedence="components">{styles}</style>
      <Link to="/" aria-current={overview ? 'page' : undefined}>
        Overview
      </Link>
      <Link to="/people" aria-current={directory || profile ? 'page' : undefined}>
        People
      </Link>
      <Link to="/about" aria-current={about ? 'page' : undefined}>
        About
      </Link>
    </nav>
  )
}
