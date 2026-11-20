import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutSkeleton, { GenericRouteSkeleton } from '../../src/components/loading/AboutSkeleton'
import styles from '../../src/components/loading/skeletons.module.css'

describe('AboutSkeleton', () => {
  it('mirrors a page heading and three section blocks with heading/text placeholders', () => {
    const { container } = render(<AboutSkeleton />)
    const root = container.querySelector('[data-testid="about-skeleton"]')

    expect(root).toHaveClass(styles.about)
    expect(root?.querySelectorAll(`.${styles.aboutHeading}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.aboutSection}`)).toHaveLength(3)
    expect(root?.querySelectorAll(`.${styles.aboutSectionHeading}`)).toHaveLength(3)
    expect(root?.querySelectorAll(`.${styles.aboutSectionCopy}`)).toHaveLength(3)
  })

  it('keeps About and wildcard placeholders decorative, nonfocusable, and separate from loading status', () => {
    const { container } = render(
      <>
        <p role="status">Loading page…</p>
        <AboutSkeleton />
        <GenericRouteSkeleton />
      </>,
    )
    for (const id of ['about-skeleton', 'generic-route-skeleton']) {
      const root = container.querySelector(`[data-testid="${id}"]`)
      expect(root).toHaveAttribute('aria-hidden', 'true')
      expect(root?.querySelector('a, button, input, textarea, select, [tabindex]')).toBeNull()
    }
    expect(screen.getByRole('status')).toHaveTextContent('Loading page…')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('provides one bounded wildcard block and three About panels using shared style hooks', () => {
    const { container } = render(
      <>
        <AboutSkeleton />
        <GenericRouteSkeleton />
      </>,
    )
    expect(container.querySelectorAll(`.${styles.aboutSection}`)).toHaveLength(3)
    const generic = container.querySelector('[data-testid="generic-route-skeleton"]')
    expect(generic).toHaveClass(styles.genericRoute)
    expect(generic?.querySelectorAll(`.${styles.genericRouteBlock}`)).toHaveLength(1)
  })
})
