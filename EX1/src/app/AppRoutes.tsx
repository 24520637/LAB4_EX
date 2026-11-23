import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes, useMatch } from 'react-router'
import RouteReadySignal from '../components/a11y/RouteReadySignal'
import AboutSkeleton, { GenericRouteSkeleton } from '../components/loading/AboutSkeleton'
import OverviewSkeleton from '../components/loading/OverviewSkeleton'
import PeopleSkeleton from '../components/loading/PeopleSkeleton'
import PersonSkeleton from '../components/loading/PersonSkeleton'
import RouteLoadingState from '../components/loading/RouteLoadingState'
import PeopleLayout from '../components/people/PeopleLayout'
import RouteBoundary from '../components/routing/RouteBoundary'
import RouteErrorBoundary from '../components/routing/RouteErrorBoundary'

const OverviewPage = lazy(() => import('../pages/OverviewPage'))
const PeoplePage = lazy(() => import('../pages/PeoplePage'))
const PersonPage = lazy(() => import('../pages/PersonPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const routes = [
  { path: '/', label: 'overview', Page: OverviewPage, Skeleton: OverviewSkeleton },
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

function PeopleRoutes() {
  const isProfile = useMatch('/people/:personId') !== null
  const label = isProfile ? 'profile' : 'people'

  // The outer fallback covers an unloaded directory. Once it mounts, the
  // profile boundary can suspend in the outlet without hiding the directory.
  return (
    <RouteErrorBoundary>
      <Suspense fallback={
        <RouteLoadingState label={label}>
          <SkeletonFallback label={label}>
            {isProfile ? <PersonSkeleton /> : <PeopleSkeleton />}
          </SkeletonFallback>
        </RouteLoadingState>
      }>
        <PeopleLayout directory={<PeoplePage variant={isProfile ? 'compact' : 'full'} />} />
      </Suspense>
    </RouteErrorBoundary>
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
      <Route path="people" element={<PeopleRoutes />}>
        <Route index element={
          <RouteReadySignal label="people">
            <p>Select a pioneer to view their profile.</p>
          </RouteReadySignal>
        } />
        <Route path=":personId" element={
          <RouteBoundary label="profile" fallback={<SkeletonFallback label="profile"><PersonSkeleton /></SkeletonFallback>}>
            <PersonPage />
          </RouteBoundary>
        } />
      </Route>
    </Routes>
  )
}
