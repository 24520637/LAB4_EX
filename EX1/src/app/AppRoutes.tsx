import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'

const OverviewPage = lazy(() => import('../pages/OverviewPage'))
const PeoplePage = lazy(() => import('../pages/PeoplePage'))
const PersonPage = lazy(() => import('../pages/PersonPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

// Distinct route boundaries show their own fallback during navigation.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Suspense key="overview" fallback={<p>Loading overview…</p>}><OverviewPage /></Suspense>} />
      <Route path="/people" element={<Suspense key="people" fallback={<p>Loading people…</p>}><PeoplePage /></Suspense>} />
      <Route path="/people/:personId" element={<Suspense key="profile" fallback={<p>Loading profile…</p>}><PersonPage /></Suspense>} />
      <Route path="/about" element={<Suspense key="about" fallback={<p>Loading about…</p>}><AboutPage /></Suspense>} />
      <Route path="*" element={<Suspense key="not-found" fallback={<p>Loading page…</p>}><NotFoundPage /></Suspense>} />
    </Routes>
  )
}
