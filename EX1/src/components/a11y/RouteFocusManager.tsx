import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useInRouterContext, useLocation } from 'react-router'

type FocusRouteHeading = (routeKey: string) => void

const RouteHeadingFocusContext = createContext<FocusRouteHeading | null>(null)

/** Coordinates committed route headings with the latest navigation history entry. */
function RoutedHeadingFocus({ children }: { children: ReactNode }) {
  const { key: routeKey, pathname } = useLocation()
  const activeRoute = useRef({ key: routeKey, pathname })
  const shouldFocus = useRef(false)

  // The first location is an initial visit, not a client-side navigation.
  // Layout effects update identity before child route-ready passive effects run.
  useLayoutEffect(() => {
    const previous = activeRoute.current
    if (previous.key !== routeKey || previous.pathname !== pathname) {
      activeRoute.current = { key: routeKey, pathname }
      // Fragment and query changes stay on the same page and keep native focus.
      shouldFocus.current = previous.pathname !== pathname
    }
  }, [routeKey, pathname])

  const focusHeading = useCallback<FocusRouteHeading>((readyKey) => {
    if (!shouldFocus.current || readyKey !== activeRoute.current.key) return

    // Scope to the route's main landmark rather than unrelated page headings.
    const heading = document.getElementById('main-content')?.querySelector('h1')
    if (!heading) return

    heading.tabIndex = -1
    const { top, bottom } = heading.getBoundingClientRect()
    heading.focus({ preventScroll: top >= 0 && bottom <= window.innerHeight })
    shouldFocus.current = false
  }, [])

  return (
    <RouteHeadingFocusContext.Provider value={focusHeading}>
      {children}
    </RouteHeadingFocusContext.Provider>
  )
}

export default function RouteFocusManager({ children }: { children: ReactNode }) {
  return useInRouterContext() ? <RoutedHeadingFocus>{children}</RoutedHeadingFocus> : children
}

/** Optional for existing isolated RouteReadySignal tests without a focus manager. */
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteHeadingFocus() {
  return useContext(RouteHeadingFocusContext)
}
