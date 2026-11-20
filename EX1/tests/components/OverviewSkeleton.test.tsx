import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OverviewSkeleton from '../../src/components/loading/OverviewSkeleton'
import styles from '../../src/components/loading/skeletons.module.css'

describe('OverviewSkeleton', () => {
  it('mirrors the heading, introduction, and featured heading with three cards', () => {
    const { container } = render(<OverviewSkeleton />)
    const root = container.querySelector('[data-testid="overview-skeleton"]')

    expect(root).toHaveClass(styles.overview)
    expect(root?.querySelectorAll(`.${styles.overviewHeading}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.overviewIntro}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.overviewSectionHeading}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.overviewCard}`)).toHaveLength(3)
    expect(root?.querySelectorAll(`.${styles.overviewAvatar}`)).toHaveLength(3)
  })

  it('remains decorative and nonfocusable, leaving announcements to its parent', () => {
    const { container } = render(
      <>
        <p role="status">Loading overview…</p>
        <OverviewSkeleton />
      </>,
    )
    const root = container.querySelector('[data-testid="overview-skeleton"]')

    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root?.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading overview…')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('provides shared responsive grid and card geometry hooks', () => {
    const { container } = render(<OverviewSkeleton />)
    const root = container.querySelector('[data-testid="overview-skeleton"]')
    expect(root?.querySelector(`.${styles.overviewGrid}`)).not.toBeNull()
    expect(root?.querySelectorAll(`.${styles.overviewCard}`)).toHaveLength(3)
    expect(root?.querySelectorAll(`.${styles.overviewAvatar}`)).toHaveLength(3)
  })
})
