import type { ComponentType } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RouteFeedbackProvider from '../../src/components/a11y/RouteFeedbackProvider'
import AppLayout from '../../src/app/AppLayout'
import AppRoutes from '../../src/app/AppRoutes'
import SiteNav from '../../src/components/navigation/SiteNav'

const pendingPages = vi.hoisted(() => {
  function deferredPage() {
    let resolve!: (module: { default: ComponentType }) => void
    const module = new Promise<{ default: ComponentType }>((done) => {
      resolve = done
    })
    return { module, load: (page: ComponentType) => resolve({ default: page }) }
  }

  return {
    overview: deferredPage(),
    people: deferredPage(),
    profile: deferredPage(),
    about: deferredPage(),
    wildcard: deferredPage(),
  }
})

vi.mock('../../src/pages/OverviewPage', () => pendingPages.overview.module)
vi.mock('../../src/pages/PeoplePage', () => pendingPages.people.module)
vi.mock('../../src/pages/PersonPage', () => pendingPages.profile.module)
vi.mock('../../src/pages/AboutPage', () => pendingPages.about.module)
vi.mock('../../src/pages/NotFoundPage', () => pendingPages.wildcard.module)

const routes = [
  {
    id: 'overview-skeleton',
    label: 'overview',
    heading: 'Pioneer Atlas',
    ready: 'Overview loaded',
    module: pendingPages.overview,
    page: () => <h1>Pioneer Atlas</h1>,
    nextLink: 'People',
  },
  {
    id: 'people-skeleton',
    label: 'people',
    heading: 'People directory',
    ready: 'People loaded',
    module: pendingPages.people,
    page: () => (
      <>
        <h1>People directory</h1>
        <Link to="/people/ada-lovelace">Ada Lovelace</Link>
      </>
    ),
    nextLink: 'Ada Lovelace',
  },
  {
    id: 'person-skeleton',
    label: 'profile',
    heading: 'Ada Lovelace',
    ready: 'Profile loaded',
    module: pendingPages.profile,
    page: () => <h1>Ada Lovelace</h1>,
    nextLink: 'About',
  },
  {
    id: 'about-skeleton',
    label: 'about',
    heading: 'About Pioneer Atlas',
    ready: 'About loaded',
    module: pendingPages.about,
    page: () => (
      <>
        <h1>About Pioneer Atlas</h1>
        <Link to="/missing/route">Unknown route</Link>
      </>
    ),
    nextLink: 'Unknown route',
  },
  {
    id: 'generic-route-skeleton',
    label: 'page',
    heading: '404 Page not found',
    ready: 'Page loaded',
    module: pendingPages.wildcard,
    page: () => (
      <>
        <h1>404 Page not found</h1>
        <Link to="/">Home</Link>
      </>
    ),
    nextLink: 'Home',
  },
]

describe('route skeleton mapping', () => {
  it('shows and replaces all five cold fallbacks while keeping navigation and feedback mounted', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteFeedbackProvider>
          <AppLayout navigation={<SiteNav />}>
            <AppRoutes />
          </AppLayout>
        </RouteFeedbackProvider>
      </MemoryRouter>,
    )

    const main = screen.getByRole('main')
    const content = within(main)
    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    const footer = screen.getByRole('contentinfo')
    const status = screen.getByRole('status')

    for (const route of routes) {
      const skeleton = await content.findByTestId(route.id)
      const busy = main.querySelector('[aria-busy="true"]')
      expect(busy).toContainElement(skeleton)
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
      expect(skeleton.querySelector('a, button, input, [tabindex]')).toBeNull()
      const visibleLabel = content.getByText('Loading ' + route.label + '…')
      expect(visibleLabel).toBeVisible()
      expect(visibleLabel).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(navigation)
      expect(screen.getByRole('contentinfo')).toBe(footer)
      expect(screen.getByRole('main')).toBe(main)
      expect(screen.getAllByRole('status')).toEqual([status])
      expect(status).not.toHaveAttribute('aria-live')
      expect(status.closest('[aria-busy="true"]')).toBeNull()
      await waitFor(() => expect(status).toHaveTextContent('Loading ' + route.label + '…'))

      await act(async () => { route.module.load(route.page) })
      expect(await content.findByRole('heading', { level: 1, name: route.heading })).toBeVisible()
      expect(content.queryByTestId(route.id)).not.toBeInTheDocument()
      expect(main.querySelector('[aria-busy="true"]')).toBeNull()
      await waitFor(() => expect(status).toHaveTextContent(route.ready))
      await user.click(screen.getByRole('link', { name: route.nextLink, exact: true }))
    }

    expect(await content.findByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
    expect(content.queryByTestId('overview-skeleton')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(status)
  })
})
