import { Suspense, type ReactNode } from 'react'

type RouteBoundaryProps = {
  label: string
  fallback?: ReactNode
  children: ReactNode
}

/** Suspends only the route content; the persistent shell stays outside. */
export default function RouteBoundary({ label, fallback, children }: RouteBoundaryProps) {
  return (
    <Suspense fallback={fallback ?? <p>Loading {label}…</p>}>
      {children}
    </Suspense>
  )
}
