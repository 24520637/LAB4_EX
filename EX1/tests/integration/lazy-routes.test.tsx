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
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile not found' })).toBeVisible()
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
