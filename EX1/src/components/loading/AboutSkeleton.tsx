import { SkeletonRectangle } from './SkeletonPrimitives'
import styles from './skeletons.module.css'

/** Decorative silhouette for the three content sections of AboutPage. */
export default function AboutSkeleton() {
  return (
    <div className={styles.about} data-testid="about-skeleton" aria-hidden="true">
      <div className={styles.aboutHeading}>
        <SkeletonRectangle width="min(22rem, 80%)" height="1.1em" />
      </div>

      {['purpose', 'splitting', 'limitations'].map((section) => (
        <div className={styles.aboutSection} key={section}>
          <div className={styles.aboutSectionHeading}>
            <SkeletonRectangle width="min(100%, 11rem)" height="1.25em" />
          </div>
          <div className={styles.aboutSectionCopy}>
            {['100%', '98%', '93%', '86%', '78%', '69%'].map((width) => (
              <SkeletonRectangle width={width} key={width} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Bounded, generic wildcard loading silhouette; no separate 404 skeleton module. */
export function GenericRouteSkeleton() {
  return (
    <div className={styles.genericRoute} data-testid="generic-route-skeleton" aria-hidden="true">
      <div className={styles.genericRouteBlock}>
        <SkeletonRectangle width="min(18rem, 78%)" />
        <SkeletonRectangle width="min(28rem, 95%)" />
        <div className={styles.genericRouteActions}>
          <SkeletonRectangle width="6.5rem" height="2.75rem" />
          <SkeletonRectangle width="6.5rem" height="2.75rem" />
        </div>
      </div>
    </div>
  )
}
