import type { ReactNode } from 'react'
import RouteAnnouncement from '../components/a11y/RouteAnnouncement'
import RouteFocusManager from '../components/a11y/RouteFocusManager'

interface AppLayoutProps {
  children: ReactNode
  navigation?: ReactNode
}

export default function AppLayout({ children, navigation }: AppLayoutProps) {
  return (
    <>
      <header className="app-shell__header">
        <p className="app-shell__brand">Pioneer Atlas</p>
        {navigation}
      </header>
      <RouteAnnouncement />
      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        <RouteFocusManager>{children}</RouteFocusManager>
      </main>
      <footer className="app-shell__footer">
        <small>Computing history project</small>
      </footer>
    </>
  )
}
