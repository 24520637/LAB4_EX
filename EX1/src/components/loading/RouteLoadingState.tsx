import { useEffect, type ReactNode } from 'react'
import { useRouteFeedback } from '../a11y/RouteFeedbackProvider'

/** The fallback itself is busy; the persistent status region lives outside it. */
export default function RouteLoadingState({ label, children }: { label: string; children?: ReactNode }) {
  const feedback = useRouteFeedback()
  const routeKey = feedback?.routeKey
  const announceLoading = feedback?.announceLoading

  useEffect(() => {
    if (routeKey && announceLoading) announceLoading(routeKey, label)
  }, [routeKey, announceLoading, label])

  return (
    <section aria-busy="true">
      {children ?? <p>Loading {label}…</p>}
    </section>
  )
}
