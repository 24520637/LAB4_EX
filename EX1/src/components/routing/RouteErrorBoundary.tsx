import { Component, useEffect, type ReactNode } from 'react'
import { Link, useInRouterContext } from 'react-router'
import { useRouteFeedback } from '../a11y/RouteFeedbackProvider'

type RouteErrorBoundaryProps = {
  children: ReactNode
  resetKey?: string
}

type RouteErrorBoundaryState = {
  failed: boolean
  resetKey?: string
}

function RouteRecovery() {
  const feedback = useRouteFeedback()
  const routeKey = feedback?.routeKey
  const clearAnnouncement = feedback?.clearAnnouncement
  const inRouter = useInRouterContext()

  useEffect(() => {
    if (routeKey !== undefined) clearAnnouncement?.(routeKey)
  }, [routeKey, clearAnnouncement])

  return (
    <section aria-labelledby="route-error-heading">
      <div role="alert">
        <h1 id="route-error-heading">This page couldn’t load</h1>
        <p>Reload the page to try again, or return home.</p>
      </div>
      <p>
        <button type="button" onClick={() => window.location.reload()}>Reload</button>
        {' '}
        {inRouter ? <Link to="/">Home</Link> : <a href="/">Home</a>}
      </p>
    </section>
  )
}

class RouteErrorCatcher extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  static getDerivedStateFromProps(
    { resetKey }: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState,
  ) {
    return resetKey === state.resetKey ? null : { failed: false, resetKey }
  }

  render() {
    return this.state.failed ? <RouteRecovery /> : this.props.children
  }
}

export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const resetKey = useRouteFeedback()?.routeKey

  return <RouteErrorCatcher resetKey={resetKey}>{children}</RouteErrorCatcher>
}
