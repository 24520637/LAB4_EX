import { SkeletonCircle, SkeletonRectangle } from './SkeletonPrimitives'
import styles from './skeletons.module.css'

/** Decorative silhouette only; RouteLoadingState owns the accessible loading text. */
export default function OverviewSkeleton() {
  return (
    <div className={styles.overview} data-testid="overview-skeleton" aria-hidden="true">
      <div className={styles.overviewHeading}>
        <SkeletonRectangle width="min(18rem, 70%)" height="1.1em" />
      </div>
      <div className={styles.overviewIntro}>
        <SkeletonRectangle width="100%" height="1.5rem" />
        <SkeletonRectangle width="85%" height="1.5rem" />
        <SkeletonRectangle width="70%" height="1.5rem" />
      </div>
      <div className={styles.overviewFeatured}>
        <div className={styles.overviewSectionHeading}>
          <SkeletonRectangle width="12rem" height="1em" />
        </div>
        <div className={styles.overviewGrid}>
          {['first', 'second', 'third'].map((slot) => (
            <div className={styles.overviewCard} key={slot}>
              <div className={styles.overviewIdentity}>
                <span className={styles.overviewAvatar}>
                  <SkeletonCircle diameter="var(--overview-avatar-size)" />
                </span>
                <div className={styles.overviewNames}>
                  <SkeletonRectangle width="75%" height="1.4rem" />
                  <SkeletonRectangle width="60%" height="0.875rem" />
                </div>
              </div>
              <div className={styles.overviewSummary}>
                <SkeletonRectangle width="100%" />
                <SkeletonRectangle width="92%" />
                <SkeletonRectangle width="72%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
