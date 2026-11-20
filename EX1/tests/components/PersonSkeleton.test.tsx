import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PersonSkeleton from '../../src/components/loading/PersonSkeleton'
import styles from '../../src/components/loading/skeletons.module.css'

describe('PersonSkeleton', () => {
  it('reserves the detail structure for any route ID', () => {
    const { container } = render(<PersonSkeleton />)
    const root = container.querySelector('[data-testid="person-skeleton"]')

    expect(root).toHaveClass(styles.person)
    expect(root?.querySelectorAll(`.${styles.personReturn}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.personHeading}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.personAvatar}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.personMetadataItem}`)).toHaveLength(2)
    expect(root?.querySelectorAll(`.${styles.personSummary}`)).toHaveLength(1)
    expect(root?.querySelectorAll(`.${styles.personContributionRow}`)).toHaveLength(2)
  })

  it('keeps placeholders decorative and out of keyboard order', () => {
    const { container } = render(
      <>
        <p role="status">Loading person details…</p>
        <PersonSkeleton />
      </>,
    )
    const root = container.querySelector('[data-testid="person-skeleton"]')

    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root?.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Loading person details…')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  it('uses shared responsive frame and typography geometry hooks', () => {
    const { container } = render(<PersonSkeleton />)
    const root = container.querySelector('[data-testid="person-skeleton"]')

    expect(root?.querySelector(`.${styles.personMetadata}`)).not.toBeNull()
    expect(root?.querySelector(`.${styles.personBiography}`)).not.toBeNull()
    expect(root?.querySelector(`.${styles.personContributions}`)).not.toBeNull()
    expect(root?.querySelectorAll(`.${styles.personSectionTitle}`)).toHaveLength(2)
  })
})
