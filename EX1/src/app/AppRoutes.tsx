import { lazy, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import AboutSkeleton, { GenericRouteSkeleton } from '../components/loading/AboutSkeleton'
import OverviewSkeleton from '../components/loading/OverviewSkeleton'
import PeopleSkeleton from '../components/loading/PeopleSkeleton'
import PersonSkeleton from '../components/loading/PersonSkeleton'
import RouteBoundary from '../components/routing/RouteBoundary'

const OverviewPage = lazy(() => import('../pages/OverviewPage'))
const PeoplePage = lazy(() => import('../pages/PeoplePage'))
const PersonPage = lazy(() => import('../pages/PersonPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const routes = [
  { path: '/', label: 'overview', Page: OverviewPage, Skeleton: OverviewSkeleton },
  { path: '/people', label: 'people', Page: PeoplePage, Skeleton: PeopleSkeleton },
  { path: '/people/:personId', label: 'profile', Page: PersonPage, Skeleton: PersonSkeleton },
  { path: '/about', label: 'about', Page: AboutPage, Skeleton: AboutSkeleton },
  { path: '*', label: 'page', Page: NotFoundPage, Skeleton: GenericRouteSkeleton },
]

function SkeletonFallback({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Use the main area's top padding so the label doesn't shift the skeleton.
          RouteAnnouncement provides the accessible copy. */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetBlockEnd: 'calc(100% + 0.25rem)',
          insetInlineStart: 0,
          fontSize: '0.875rem',
          color: 'var(--color-muted)',
        }}
      >
        Loading {label}…
      </span>
      {children}
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {routes.map(({ path, label, Page, Skeleton }) => (
        <Route
          key={path}
          path={path}
          element={
            <RouteBoundary
              key={path}
              label={label}
              fallback={<SkeletonFallback label={label}><Skeleton /></SkeletonFallback>}
            >
              <Page />
            </RouteBoundary>
          }
        />
      ))}
    </Routes>
  )
}
