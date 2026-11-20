import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PeopleSkeleton from '../../src/components/loading/PeopleSkeleton'
import styles from '../../src/components/loading/skeletons.module.css'

describe('PeopleSkeleton', () => {
  it('mirrors the directory heading, full-width search block, and six profile cards', () => {
    const { container } = render(<PeopleSkeleton />)
    const root = container.querySelector('[data-testid="people-skeleton"]')

    expect(root).toHaveClass(styles.people)
    expect(root?.querySelectorAll(`.${styles.peopleHeading}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.peopleSearch}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.peopleSearchField}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.peopleCard}`)).toHaveLength(6)
    expect(root?.querySelectorAll(`.${styles.peopleAvatar}`)).toHaveLength(6)
  })

  it('is entirely decorative and nonfocusable; live loading text stays outside it', () => {
    const { container } = render(
      <>
        <p role="status">Loading people…</p>
        <PeopleSkeleton />
      </>,
    )
    const root = container.querySelector('[data-testid="people-skeleton"]')

    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root?.querySelector('input, button, a, select, textarea, [tabindex]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading people…')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('uses responsive grid and shared dimensions for the search area and cards', () => {
    const { container } = render(<PeopleSkeleton />)
    const root = container.querySelector('[data-testid="people-skeleton"]')

    expect(root?.querySelector(`.${styles.peopleGrid}`)).not.toBeNull()
    expect(root?.querySelectorAll(`.${styles.peopleCard}`)).toHaveLength(6)
    expect(root?.querySelectorAll(`.${styles.peopleAvatar}`)).toHaveLength(6)
  })
})
