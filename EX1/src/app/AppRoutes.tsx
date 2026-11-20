import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import RouteBoundary from '../components/routing/RouteBoundary'

const OverviewPage = lazy(() => import('../pages/OverviewPage'))
const PeoplePage = lazy(() => import('../pages/PeoplePage'))
const PersonPage = lazy(() => import('../pages/PersonPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteBoundary key="overview" label="overview" fallback={<p>Loading overview…</p>}>
            <OverviewPage />
          </RouteBoundary>
        }
      />
      <Route
        path="/people"
        element={
          <RouteBoundary key="people" label="people" fallback={<p>Loading people…</p>}>
            <PeoplePage />
          </RouteBoundary>
        }
      />
      <Route
        path="/people/:personId"
        element={
          <RouteBoundary key="profile" label="profile" fallback={<p>Loading profile…</p>}>
            <PersonPage />
          </RouteBoundary>
        }
      />
      <Route
        path="/about"
        element={
          <RouteBoundary key="about" label="about" fallback={<p>Loading about…</p>}>
            <AboutPage />
          </RouteBoundary>
        }
      />
      <Route
        path="*"
        element={
          <RouteBoundary key="not-found" label="page" fallback={<p>Loading page…</p>}>
            <NotFoundPage />
          </RouteBoundary>
        }
      />
    </Routes>
  )
}
