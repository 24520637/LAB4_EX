import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from '../../src/app/App'
import AppLayout from '../../src/app/AppLayout'
import SiteNav from '../../src/components/navigation/SiteNav'
import SkipLink from '../../src/components/navigation/SkipLink'

function renderNavigation(path = '/') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <SkipLink />
      <AppLayout navigation={<SiteNav />}>
        <h1>Test page</h1>
      </AppLayout>
    </MemoryRouter>,
  )

  return user
}

describe('SiteNav', () => {
  it('renders exactly the three destinations inside the primary navigation', () => {
    render(<App />)

    const banner = screen.getByRole('banner')
    const navigation = within(banner).getByRole('navigation', { name: 'Primary' })
    const links = within(navigation).getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(['Overview', 'People', 'About'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/people', '/about'])
  })

  it.each([
    ['/', 'Overview'],
    ['/people', 'People'],
    ['/about', 'About'],
  ])('marks only the link for %s as the current page', (path, name) => {
    renderNavigation(path)

    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    const currentLinks = within(navigation).getAllByRole('link', { current: 'page' })

    expect(currentLinks).toEqual([within(navigation).getByRole('link', { name })])
  })

  it('leaves the directory link unmarked when viewing a person detail URL', () => {
    renderNavigation('/people/ada-lovelace')

    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(navigation).queryByRole('link', { current: 'page' })).not.toBeInTheDocument()
  })

  it('supports reaching and activating the navigation links with Tab and Enter', async () => {
    const user = renderNavigation()
    const navigation = screen.getByRole('navigation', { name: 'Primary' })
    const overview = within(navigation).getByRole('link', { name: 'Overview' })
    const people = within(navigation).getByRole('link', { name: 'People' })
    const about = within(navigation).getByRole('link', { name: 'About' })

    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
    await user.tab()
    expect(overview).toHaveFocus()
    await user.tab()
    expect(people).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(people).toHaveAttribute('aria-current', 'page')
    expect(overview).not.toHaveAttribute('aria-current')

    await user.tab()
    expect(about).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(about).toHaveAttribute('aria-current', 'page')
    expect(people).not.toHaveAttribute('aria-current')
  })
})

describe('SkipLink', () => {
  it('receives the first Tab and targets the programmatically focusable main landmark', async () => {
    const user = renderNavigation()
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    const main = screen.getByRole('main')

    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(skipLink).toHaveFocus()
  })
})
