import { SkeletonCircle, SkeletonRectangle } from './SkeletonPrimitives'
import styles from './skeletons.module.css'

/** One decorative detail silhouette for every person slug; RouteLoadingState announces loading. */
export default function PersonSkeleton() {
  return (
    <div className={styles.person} data-testid="person-skeleton" aria-hidden="true">
      <div className={styles.personReturn}>
        <SkeletonRectangle width="12rem" height="1.55rem" />
      </div>

      <div className={styles.personHeading}>
        <span className={styles.personAvatar}>
          <SkeletonCircle diameter="var(--person-avatar-size)" />
        </span>
        <SkeletonRectangle width="min(19rem, 70%)" height="1.1em" />
      </div>

      <div className={styles.personMetadata}>
        {['era', 'field'].map((item) => (
          <div className={styles.personMetadataItem} key={item}>
            <SkeletonRectangle width="3.5rem" height="0.875rem" />
            <SkeletonRectangle width="min(100%, 17rem)" height="1rem" />
          </div>
        ))}
      </div>

      <div className={styles.personBiography}>
        <div className={styles.personSectionTitle}>
          <SkeletonRectangle width="10rem" height="1em" />
        </div>
        <div className={styles.personSummary}>
          <SkeletonRectangle width="100%" />
          <SkeletonRectangle width="100%" />
          <SkeletonRectangle width="90%" />
          <SkeletonRectangle width="78%" />
        </div>
      </div>

      <div className={styles.personContributions}>
        <div className={styles.personSectionTitle}>
          <SkeletonRectangle width="12rem" height="1em" />
        </div>
        <div className={styles.personContributionList}>
          {['first', 'second'].map((item) => (
            <div className={styles.personContributionRow} key={item}>
              <SkeletonRectangle width="100%" />
              <SkeletonRectangle width="88%" />
              <SkeletonRectangle width="76%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
