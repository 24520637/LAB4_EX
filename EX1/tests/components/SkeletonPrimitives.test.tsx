import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  SkeletonCircle,
  SkeletonGroup,
  SkeletonRectangle,
} from '../../src/components/loading/SkeletonPrimitives'
import styles from '../../src/components/loading/skeletons.module.css'

describe('decorative skeleton primitives', () => {
  it('hides an entire decorative group without hiding a separate loading message', () => {
    const { container } = render(
      <>
        <p role="status">Loading pioneers…</p>
        <SkeletonGroup>
          <SkeletonRectangle />
          <SkeletonCircle />
        </SkeletonGroup>
      </>,
    )

    const group = container.querySelector('[aria-hidden="true"]')
    expect(group).toHaveClass(styles.group)
    expect(group?.querySelectorAll('span')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Loading pioneers…')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('provides nonfocusable rectangle and circle variants with styling hooks', () => {
    const { container } = render(
      <>
        <SkeletonRectangle />
        <SkeletonCircle />
      </>,
    )

    const shapes = container.querySelectorAll('span')
    expect(shapes).toHaveLength(2)
    expect(shapes[0]).toHaveClass(styles.rectangle)
    expect(shapes[1]).toHaveClass(styles.circle)
    for (const shape of shapes) {
      expect(shape).toHaveAttribute('aria-hidden', 'true')
      expect(shape).not.toHaveAttribute('tabindex')
      expect(shape).not.toHaveAttribute('role')
    }
  })

  it('allows fixed geometry through CSS variables without exposing extra roles', () => {
    const { container } = render(
      <SkeletonGroup>
        <SkeletonRectangle width="55%" height="2rem" />
        <SkeletonCircle diameter="3rem" />
      </SkeletonGroup>,
    )

    const [rectangle, circle] = Array.from(container.querySelectorAll('span'))
    expect(rectangle).toHaveStyle({ '--skeleton-width': '55%', '--skeleton-height': '2rem' })
    expect(circle).toHaveStyle({ '--skeleton-diameter': '3rem' })
    expect(container.querySelector('[tabindex]')).toBeNull()
    expect(container.querySelector('button, a, input')).toBeNull()
  })
})
