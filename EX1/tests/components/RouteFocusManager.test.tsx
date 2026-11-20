import { lazy, type ComponentType } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import RouteFocusManager from '../../src/components/a11y/RouteFocusManager'
import RouteFeedbackProvider from '../../src/components/a11y/RouteFeedbackProvider'
import RouteReadySignal from '../../src/components/a11y/RouteReadySignal'
import RouteBoundary from '../../src/components/routing/RouteBoundary'

function deferredPage(title: string) {
  let resolve!: (module: { default: ComponentType }) => void
  const promise = new Promise<{ default: ComponentType }>((done) => { resolve = done })
  const Page = lazy(() => promise)
  return { Page, resolve: () => resolve({ default: () => <h1>{title}</h1> }) }
}

function Harness({ overview, people, about }: { overview: ComponentType; people: ComponentType; about: ComponentType }) {
  const Overview = overview
  const People = people
  const About = about
  return (
    <MemoryRouter initialEntries={['/']}>
      <RouteFeedbackProvider>
      <nav aria-label="Primary">
        <Link to="/">Overview</Link>
        <Link to="/people">People</Link>
        <Link to="/about">About</Link>
      </nav>
      <main id="main-content">
        <RouteFocusManager>
          <Routes>
            <Route path="/" element={<RouteBoundary key="overview" label="overview"><Overview /></RouteBoundary>} />
            <Route path="/people" element={<RouteBoundary key="people" label="people"><People /></RouteBoundary>} />
            <Route path="/about" element={<RouteBoundary key="about" label="about"><About /></RouteBoundary>} />
          </Routes>
        </RouteFocusManager>
      </main>
      </RouteFeedbackProvider>
    </MemoryRouter>
  )
}

describe('RouteFocusManager', () => {
  it('does not steal focus on initial load, including after initial lazy resolution', async () => {
    const overview = deferredPage('Overview ready')
    const people = deferredPage('People ready')
    const about = deferredPage('About ready')
    render(<Harness overview={overview.Page} people={people.Page} about={about.Page} />)
    const link = screen.getByRole('link', { name: 'People' })
    link.focus()
    await act(async () => { overview.resolve() })
    expect(await screen.findByRole('heading', { name: 'Overview ready' })).toBeVisible()
    expect(link).toHaveFocus()
  })

  it('focuses the newly committed heading only after a deferred page resolves', async () => {
    const overview = deferredPage('Overview ready')
    const people = deferredPage('People ready')
    const about = deferredPage('About ready')
    render(<Harness overview={overview.Page} people={people.Page} about={about.Page} />)
    await act(async () => { overview.resolve() })
    const link = screen.getByRole('link', { name: 'People' })
    await userEvent.click(link)
    expect(link).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'People ready' })).not.toBeInTheDocument()
    await act(async () => { people.resolve() })
    const heading = await screen.findByRole('heading', { name: 'People ready' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(heading).toHaveAttribute('tabindex', '-1')
  })

  it('does not focus an obsolete route after rapid navigation', async () => {
    const overview = deferredPage('Overview ready')
    const people = deferredPage('People ready')
    const about = deferredPage('About ready')
    render(<Harness overview={overview.Page} people={people.Page} about={about.Page} />)
    await act(async () => { overview.resolve() })
    await userEvent.click(screen.getByRole('link', { name: 'People' }))
    await userEvent.click(screen.getByRole('link', { name: 'About' }))
    await act(async () => { about.resolve() })
    const heading = await screen.findByRole('heading', { name: 'About ready' })
    await waitFor(() => expect(heading).toHaveFocus())
    await act(async () => { people.resolve() })
    expect(heading).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'People ready' })).not.toBeInTheDocument()
  })

  it('preserves focus when only the fragment changes', async () => {
    render(
      <MemoryRouter initialEntries={['/people']}>
        <RouteFeedbackProvider>
          <Link to="/people#main-content">Jump within People</Link>
          <main id="main-content">
            <RouteFocusManager>
              <RouteReadySignal label="people"><h1>People ready</h1></RouteReadySignal>
            </RouteFocusManager>
          </main>
        </RouteFeedbackProvider>
      </MemoryRouter>,
    )

    const jump = screen.getByRole('link', { name: 'Jump within People' })
    await userEvent.click(jump)
    expect(jump).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'People ready' })).not.toHaveFocus()
  })

  it('focuses the route heading again on browser Back navigation', async () => {
    function Controls() {
      const navigate = useNavigate()
      return <button type="button" onClick={() => navigate(-1)}>Back</button>
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteFeedbackProvider>
        <nav><Link to="/people">People</Link></nav>
        <Controls />
        <main id="main-content">
          <RouteFocusManager>
            <Routes>
              <Route path="/" element={<RouteReadySignal label="overview"><h1>Overview ready</h1></RouteReadySignal>} />
              <Route path="/people" element={<RouteReadySignal label="people"><h1>People ready</h1></RouteReadySignal>} />
            </Routes>
          </RouteFocusManager>
        </main>
        </RouteFeedbackProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Overview ready' })).not.toHaveFocus()
    await userEvent.click(screen.getByRole('link', { name: 'People' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'People ready' })).toHaveFocus())
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Overview ready' })).toHaveFocus())
  })
})
