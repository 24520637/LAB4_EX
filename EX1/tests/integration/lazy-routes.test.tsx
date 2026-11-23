import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../src/app/App'
import AppLayout from '../../src/app/AppLayout'
import AppRoutes from '../../src/app/AppRoutes'
import SiteNav from '../../src/components/navigation/SiteNav'

function renderAt(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppLayout navigation={<SiteNav />}>
        <AppRoutes />
      </AppLayout>
    </MemoryRouter>,
  )
}

const cases = [
  ['/', 'Pioneer Atlas'],
  ['/people', 'People'],
  ['/people/ada-lovelace', 'Ada Lovelace'],
  ['/about', 'About Pioneer Atlas'],
  ['/not-a-route', '404 Page not found'],
  ['/people/ada-lovelace/extra', '404 Page not found'],
] as const

describe('lazy application routes', () => {
  it.each(cases)('loads %s as the expected page', async (path, heading) => {
    renderAt(path)
    const main = screen.getByRole('main')
    expect(await within(main).findByRole('heading', { name: heading, level: 1 })).toBeVisible()
    expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('handles an unknown person without a crash', async () => {
    renderAt('/people/no-such-person')
    const master = await screen.findByRole('region', { name: 'Pioneer directory' })
    const detail = screen.getByRole('region', { name: 'Pioneer details' })
    expect(within(master).getAllByRole('link')).toHaveLength(6)
    expect(await within(detail).findByRole('heading', { level: 1, name: 'Profile not found' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to people directory' })).toHaveAttribute('href', '/people')
  })

  it('navigates between pages while preserving the header, main, and footer', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')
    expect(await within(main).findByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'People', current: false }))
    expect(await within(main).findByRole('heading', { level: 1, name: 'People' })).toBeVisible()
    expect(screen.getByRole('banner')).toBe(header)
    expect(screen.getByRole('main')).toBe(main)
    expect(screen.getByRole('contentinfo')).toBe(footer)
    expect(within(main).queryByRole('heading', { level: 1, name: 'Pioneer Atlas' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'About' }))
    expect(await within(main).findByRole('heading', { level: 1, name: 'About Pioneer Atlas' })).toBeVisible()
    expect(screen.getByRole('banner')).toBe(header)
  })


  it('keeps the same filtered directory across profile selection, Back, and Forward', async () => {
    const originalPath = window.location.pathname
    window.history.replaceState({}, '', '/people')
    const user = userEvent.setup()

    try {
      render(<App />)
      const search = await screen.findByRole('searchbox', { name: 'Search by name' })
      const master = screen.getByRole('region', { name: 'Pioneer directory' })
      const detail = screen.getByRole('region', { name: 'Pioneer details' })
      expect(within(detail).getByText('Select a pioneer to view their profile.')).toBeVisible()
      await user.type(search, '  rA  ')
      await user.tab()
      expect(within(master).getByRole('link', { name: 'Grace Hopper' })).toHaveFocus()
      await user.keyboard('{Enter}')

      const grace = await within(detail).findByRole('heading', { level: 1, name: 'Grace Hopper' })
      await waitFor(() => expect(grace).toHaveFocus())
      expect(window.location.pathname).toBe('/people/grace-hopper')
      expect(screen.getAllByRole('heading', { level: 1 })).toEqual([grace])
      expect(within(master).getByRole('heading', { level: 2, name: 'People' })).toBeVisible()

      await user.click(within(master).getByRole('link', { name: 'Radia Perlman' }))
      const radia = await within(detail).findByRole('heading', { level: 1, name: 'Radia Perlman' })
      await waitFor(() => expect(radia).toHaveFocus())
      expect(screen.getByRole('searchbox')).toBe(search)
      expect(search).toHaveValue('  rA  ')

      window.history.back()
      await waitFor(() => expect(window.location.pathname).toBe('/people/grace-hopper'))
      expect(await within(detail).findByRole('heading', { level: 1, name: 'Grace Hopper' })).toHaveFocus()
      window.history.back()
      await waitFor(() => expect(window.location.pathname).toBe('/people'))
      expect(await within(master).findByRole('heading', { level: 1, name: 'People' })).toHaveFocus()

      window.history.forward()
      await waitFor(() => expect(window.location.pathname).toBe('/people/grace-hopper'))
      expect(await within(detail).findByRole('heading', { level: 1, name: 'Grace Hopper' })).toHaveFocus()
      expect(screen.getByRole('region', { name: 'Pioneer directory' })).toBe(master)
      expect(screen.getByRole('searchbox')).toBe(search)
      expect(search).toHaveValue('  rA  ')
      expect(within(master).getAllByRole('link')).toHaveLength(2)
    } finally {
      window.history.replaceState({}, '', originalPath)
    }
  })

  it('supports Back and Forward through the real BrowserRouter', async () => {
    const originalPath = window.location.pathname
    window.history.replaceState({}, '', '/')
    const user = userEvent.setup()
    try {
      render(<App />)
      expect(await screen.findByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
      await user.click(screen.getByRole('link', { name: 'About' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'About Pioneer Atlas' })).toBeVisible()
      window.history.back()
      await waitFor(() => expect(window.location.pathname).toBe('/'))
      expect(await screen.findByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
      window.history.forward()
      await waitFor(() => expect(window.location.pathname).toBe('/about'))
      expect(await screen.findByRole('heading', { level: 1, name: 'About Pioneer Atlas' })).toBeVisible()
    } finally {
      window.history.replaceState({}, '', originalPath)
    }
  })
})
