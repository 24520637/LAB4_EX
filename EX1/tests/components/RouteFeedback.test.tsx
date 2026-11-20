import { lazy, type ComponentType } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import RouteFeedbackProvider from '../../src/components/a11y/RouteFeedbackProvider'
import RouteAnnouncement from '../../src/components/a11y/RouteAnnouncement'
import RouteBoundary from '../../src/components/routing/RouteBoundary'

function deferredPage(heading: string) {
  let resolve!: (value: { default: ComponentType }) => void
  const promise = new Promise<{ default: ComponentType }>((done) => { resolve = done })
  const Page = lazy(() => promise)
  return { Page, resolve: () => resolve({ default: () => <h1>{heading}</h1> }) }
}

function Harness({ overview, people }: { overview: ComponentType; people: ComponentType }) {
  const Overview = overview
  const People = people
  return (
    <MemoryRouter initialEntries={['/']}>
      <RouteFeedbackProvider>
        <nav aria-label="Primary"><Link to="/">Overview</Link><Link to="/people">People</Link></nav>
        <RouteAnnouncement />
        <main>
          <Routes>
            <Route path="/" element={<RouteBoundary key="overview" label="overview"><Overview /></RouteBoundary>} />
            <Route path="/people" element={<RouteBoundary key="people" label="people"><People /></RouteBoundary>} />
          </Routes>
        </main>
      </RouteFeedbackProvider>
    </MemoryRouter>
  )
}

describe('route loading announcements', () => {
  it('keeps exactly one persistent polite status and a busy visible fallback until ready', async () => {
    const overview = deferredPage('Overview ready')
    const people = deferredPage('People ready')
    render(<Harness overview={overview.Page} people={people.Page} />)

    const status = screen.getByRole('status')
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(status).not.toHaveAttribute('aria-live')
    expect(within(screen.getByRole('main')).getByText('Loading overview…').parentElement).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByRole('status')).toBe(status)
    await waitFor(() => expect(status).toHaveTextContent('Loading overview'))

    await act(async () => { overview.resolve() })
    expect(await screen.findByRole('heading', { name: 'Overview ready' })).toBeVisible()
    await waitFor(() => expect(status).toHaveTextContent('Overview loaded'))
    expect(within(screen.getByRole('main')).queryByText('Loading overview…')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(status)
  })

  it('preserves navigation and reports the current route when a new page loads', async () => {
    const overview = deferredPage('Overview ready')
    const people = deferredPage('People ready')
    render(<Harness overview={overview.Page} people={people.Page} />)
    await act(async () => { overview.resolve() })
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const status = screen.getByRole('status')

    await userEvent.click(screen.getByRole('link', { name: 'People' }))
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(nav)
    expect((await within(screen.getByRole('main')).findByText('Loading people…')).parentElement).toHaveAttribute('aria-busy', 'true')
    await waitFor(() => expect(status).toHaveTextContent('Loading people'))

    await act(async () => { people.resolve() })
    expect(await screen.findByRole('heading', { name: 'People ready' })).toBeVisible()
    await waitFor(() => expect(status).toHaveTextContent('People loaded'))
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(nav)
    expect(screen.getByRole('status')).toBe(status)
  })

  it('does not announce completion from an obsolete deferred route after navigating away', async () => {
    const overview = deferredPage('Old overview')
    const people = deferredPage('Current people')
    render(<Harness overview={overview.Page} people={people.Page} />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Loading overview'))

    await userEvent.click(screen.getByRole('link', { name: 'People' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Loading people'))
    await act(async () => { people.resolve() })
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('People loaded'))
    await act(async () => { overview.resolve() })
    expect(screen.getByRole('status')).toHaveTextContent('People loaded')
    expect(screen.queryByRole('heading', { name: 'Old overview' })).not.toBeInTheDocument()
  })

  it('does not announce a false loading phase for immediately available routes', async () => {
    function InstantPages() {
      const navigate = useNavigate()
      return (
        <>
          <button type="button" onClick={() => navigate('/people')}>Go to people</button>
          <Routes>
            <Route path="/" element={<RouteBoundary key="overview" label="overview"><h1>Overview ready</h1></RouteBoundary>} />
            <Route path="/people" element={<RouteBoundary key="people" label="people"><h1>People ready</h1></RouteBoundary>} />
          </Routes>
        </>
      )
    }
    render(
      <MemoryRouter>
        <RouteFeedbackProvider><RouteAnnouncement /><InstantPages /></RouteFeedbackProvider>
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Overview loaded'))
    await userEvent.click(screen.getByRole('button', { name: 'Go to people' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('People loaded'))
    expect(screen.queryByText('Loading people…')).not.toBeInTheDocument()
  })
})
