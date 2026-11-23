import { NavLink, useMatch } from 'react-router'

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
  .site-nav a.site-nav__link--active {
    color: var(--color-accent);
    text-decoration-color: currentColor;
  }

  .site-nav a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

function activeLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'site-nav__link--active' : undefined
}

export default function SiteNav() {
  const directory = useMatch('/people')
  const profile = useMatch('/people/:personId')
  const about = useMatch('/about')

  return (
    <nav aria-label="Primary" className="site-nav">
      <style href="pioneer-atlas-site-nav" precedence="components">{styles}</style>
      <NavLink to="/" end className={activeLinkClass}>Overview</NavLink>
      {/* Match the known route patterns, including their trailing slash variants. */}
      <NavLink to="/people" end={!directory && !profile} className={activeLinkClass}>People</NavLink>
      <NavLink to="/about" end={!about} className={activeLinkClass}>About</NavLink>
    </nav>
  )
}
