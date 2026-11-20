import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import NotFoundPage from '../../src/pages/NotFoundPage'

function renderUnknownRoute() {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/missing/page']}>
      <Routes>
        <Route path="/" element={<h1>Pioneer Atlas</h1>} />
        <Route path="/people" element={<h1>People directory</h1>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  )

  return user
}

describe('NotFoundPage', () => {
  it('explains the missing page beneath a single 404 heading', () => {
    renderUnknownRoute()

    const heading = screen.getByRole('heading', { level: 1, name: '404 Page not found' })
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([heading])
    expect(screen.getByText('Check the address or choose a destination below.')).toBeVisible()
  })

  it('offers native recovery links to Home and People', () => {
    renderUnknownRoute()

    const navigation = screen.getByRole('navigation', { name: 'Recovery' })
    expect(within(navigation).getAllByRole('link')).toHaveLength(2)
    expect(within(navigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(navigation).getByRole('link', { name: 'People' })).toHaveAttribute('href', '/people')
  })

  it('follows the natural Tab order without trapping focus', async () => {
    const user = renderUnknownRoute()
    const home = screen.getByRole('link', { name: 'Home' })
    const people = screen.getByRole('link', { name: 'People' })

    expect(home).not.toHaveFocus()
    await user.tab()
    expect(home).toHaveFocus()
    await user.tab()
    expect(people).toHaveFocus()
    await user.tab({ shift: true })
    expect(home).toHaveFocus()
    await user.tab({ shift: true })
    expect(home).not.toHaveFocus()
  })

  it.each([
    { label: 'Home', tabs: 1, heading: 'Pioneer Atlas' },
    { label: 'People', tabs: 2, heading: 'People directory' },
  ])('opens $label using Enter', async ({ label, tabs, heading }) => {
    const user = renderUnknownRoute()

    for (let index = 0; index < tabs; index++) {
      await user.tab()
    }

    expect(screen.getByRole('link', { name: label })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  })
})
