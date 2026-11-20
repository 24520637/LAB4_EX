import { lazy, type ComponentType } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RouteFeedbackProvider from '../../src/components/a11y/RouteFeedbackProvider'
import RouteAnnouncement from '../../src/components/a11y/RouteAnnouncement'
import RouteBoundary from '../../src/components/routing/RouteBoundary'

const importError = 'test-only rejected chunk details'

function renderPendingProfile() {
  let rejectImport!: (error: Error) => void
  const promise = new Promise<{ default: ComponentType }>((_, reject) => {
    rejectImport = reject
  })
  const BrokenProfile = lazy(() => promise)

  function ProfileRoute() {
    const { personId } = useParams<'personId'>()
    return (
      <RouteBoundary label="profile">
        {personId === 'broken' ? <BrokenProfile /> : <h1>Available profile</h1>}
      </RouteBoundary>
    )
  }

  render(
    <MemoryRouter initialEntries={['/people/broken']}>
      <RouteFeedbackProvider>
        <nav aria-label="Primary">
          <Link to="/people/available">Available profile</Link>
        </nav>
        <RouteAnnouncement />
        <main>
          <Routes>
            <Route path="/" element={<RouteBoundary label="overview"><h1>Home page</h1></RouteBoundary>} />
            <Route path="/people/:personId" element={<ProfileRoute />} />
          </Routes>
        </main>
      </RouteFeedbackProvider>
    </MemoryRouter>,
  )

  return { rejectImport, user: userEvent.setup() }
}

async function rejectChunk(rejectImport: (error: Error) => void) {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await act(async () => { rejectImport(new Error(importError)) })
  } finally {
    consoleError.mockRestore()
  }
}

describe('route chunk recovery', () => {
  it('replaces the busy fallback with one alert and clears the polite loading message', async () => {
    const { rejectImport, user } = renderPendingProfile()
    const main = screen.getByRole('main')
    const content = within(main)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const status = screen.getByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('Loading profile…'))
    expect(main.querySelector('[aria-busy="true"]')).toBeInTheDocument()

    await rejectChunk(rejectImport)

    const alert = await content.findByRole('alert')
    expect(screen.getAllByRole('alert')).toEqual([alert])
    expect(within(alert).getByRole('heading', { level: 1, name: 'This page couldn’t load' })).toBeVisible()
    expect(screen.queryByText(importError)).not.toBeInTheDocument()
    expect(main.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBe(status)
    await waitFor(() => expect(status).toBeEmptyDOMElement())
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(nav)

    const reload = content.getByRole('button', { name: 'Reload' })
    const home = content.getByRole('link', { name: 'Home' })
    expect(home).toHaveAttribute('href', '/')
    await user.tab()
    await user.tab()
    expect(reload).toHaveFocus()
    await user.tab()
    expect(home).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await content.findByRole('heading', { level: 1, name: 'Home page' })).toBeVisible()
    expect(content.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('resets a failed boundary on a new location key for the same route pattern', async () => {
    const { rejectImport, user } = renderPendingProfile()
    await rejectChunk(rejectImport)
    expect(await screen.findByRole('alert')).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'Available profile' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Available profile' })).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Profile loaded'))
  })

  it('leaves a newer route ready when an abandoned import rejects', async () => {
    const { rejectImport, user } = renderPendingProfile()
    const status = screen.getByRole('status')
    await waitFor(() => expect(status).toHaveTextContent('Loading profile…'))

    await user.click(screen.getByRole('link', { name: 'Available profile' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Available profile' })).toBeVisible()
    await waitFor(() => expect(status).toHaveTextContent('Profile loaded'))

    await rejectChunk(rejectImport)
    expect(status).toHaveTextContent('Profile loaded')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
