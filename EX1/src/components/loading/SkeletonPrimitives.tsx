import type { CSSProperties, ReactNode } from 'react'
import styles from './skeletons.module.css'

/** Decorative shapes only. Loading text and ARIA status belong to RouteLoadingState. */
type SkeletonGroupProps = { children: ReactNode }
type SkeletonRectangleProps = { width?: string; height?: string }
type SkeletonCircleProps = { diameter?: string }

export function SkeletonGroup({ children }: SkeletonGroupProps) {
  return (
    <div className={styles.group} aria-hidden="true">
      {children}
    </div>
  )
}

export function SkeletonRectangle({ width, height }: SkeletonRectangleProps) {
  return (
    <span
      className={`${styles.shape} ${styles.rectangle}`}
      aria-hidden="true"
      style={{ '--skeleton-width': width, '--skeleton-height': height } as CSSProperties}
    />
  )
}

export function SkeletonCircle({ diameter }: SkeletonCircleProps) {
  return (
    <span
      className={`${styles.shape} ${styles.circle}`}
      aria-hidden="true"
      style={{ '--skeleton-diameter': diameter } as CSSProperties}
    />
  )
}
