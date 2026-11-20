import { Suspense, type ReactNode } from 'react'
import RouteReadySignal from '../a11y/RouteReadySignal'
import RouteLoadingState from '../loading/RouteLoadingState'
import RouteErrorBoundary from './RouteErrorBoundary'

type RouteBoundaryProps = {
  label: string
  fallback?: ReactNode
  children: ReactNode
}

/** Suspends only the route content; the persistent shell stays outside. */
export default function RouteBoundary({ label, fallback, children }: RouteBoundaryProps) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingState label={label}>{fallback}</RouteLoadingState>}>
        <RouteReadySignal label={label}>{children}</RouteReadySignal>
      </Suspense>
    </RouteErrorBoundary>
  )
}
