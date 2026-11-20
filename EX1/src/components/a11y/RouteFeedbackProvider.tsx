import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router'

type RouteEvent = {
  key: string
  message: string
}

type RouteFeedback = {
  routeKey: string
  message: string
  announceLoading: (routeKey: string, label: string) => void
  announceReady: (routeKey: string, label: string) => void
  clearAnnouncement: (routeKey: string) => void
}

const RouteFeedbackContext = createContext<RouteFeedback | null>(null)

/** Optional for isolated component tests outside a router/provider. */
// Scoped T-05.02 exports both the provider and its consuming hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteFeedback() {
  return useContext(RouteFeedbackContext)
}

/** Only the current history entry may publish updates to the polite status node. */
export default function RouteFeedbackProvider({ children }: { children: ReactNode }) {
  const { key: routeKey } = useLocation()
  const activeKey = useRef(routeKey)
  const [event, setEvent] = useState<RouteEvent | null>(null)

  // Layout effects update identity before passive loading/ready signals run.
  useLayoutEffect(() => {
    activeKey.current = routeKey
  }, [routeKey])

  const announceLoading = useCallback((key: string, label: string) => {
    if (key !== activeKey.current) return
    setEvent({ key, message: `Loading ${label}…` })
  }, [])

  const announceReady = useCallback((key: string, label: string) => {
    if (key !== activeKey.current) return
    setEvent({ key, message: `${label.charAt(0).toUpperCase()}${label.slice(1)} loaded` })
  }, [])

  const clearAnnouncement = useCallback((key: string) => {
    if (key !== activeKey.current) return
    setEvent((current) => current?.key === key ? null : current)
  }, [])

  // A previous route's message is never displayed for a new history entry.
  const message = event?.key === routeKey ? event.message : ''
  const value = useMemo(
    () => ({ routeKey, message, announceLoading, announceReady, clearAnnouncement }),
    [routeKey, message, announceLoading, announceReady, clearAnnouncement],
  )

  return <RouteFeedbackContext.Provider value={value}>{children}</RouteFeedbackContext.Provider>
}
