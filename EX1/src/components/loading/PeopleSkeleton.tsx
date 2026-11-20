import { SkeletonCircle, SkeletonRectangle } from './SkeletonPrimitives'
import styles from './skeletons.module.css'

/** Decorative geometry only; RouteLoadingState owns the accessible loading status. */
export default function PeopleSkeleton() {
  return (
    <div className={styles.people} data-testid="people-skeleton" aria-hidden="true">
      <div className={styles.peopleHeading}>
        <SkeletonRectangle width="min(11rem, 60%)" height="1.1em" />
      </div>
      <div className={styles.peopleSearch}>
        <SkeletonRectangle width="8rem" height="1.55rem" />
        <div className={styles.peopleSearchField}>
          <SkeletonRectangle width="100%" height="100%" />
        </div>
      </div>
      <div className={styles.peopleGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <div className={styles.peopleCard} key={index}>
            <span className={styles.peopleAvatar}>
              <SkeletonCircle diameter="var(--people-avatar-size)" />
            </span>
            <div className={styles.peopleCardText}>
              <SkeletonRectangle width="80%" height="1.40625rem" />
              <SkeletonRectangle width="66%" height="1.1rem" />
              <SkeletonRectangle width="46%" height="1.1rem" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
