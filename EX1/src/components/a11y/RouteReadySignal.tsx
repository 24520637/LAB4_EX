import { useEffect, type ReactNode } from 'react'
import { useRouteFeedback } from './RouteFeedbackProvider'

/** Runs only after the lazy page subtree has committed successfully. */
export default function RouteReadySignal({ label, children }: { label: string; children: ReactNode }) {
  const feedback = useRouteFeedback()
  const routeKey = feedback?.routeKey
  const announceReady = feedback?.announceReady

  useEffect(() => {
    if (routeKey && announceReady) announceReady(routeKey, label)
  }, [routeKey, announceReady, label])

  return <>{children}</>
}
