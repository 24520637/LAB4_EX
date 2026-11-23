import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { people } from '../../src/data/people'
import PeoplePage from '../../src/pages/PeoplePage'

function renderDirectory(variant?: 'full' | 'compact') {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/people']}>
      <Routes>
        <Route path="/people" element={<PeoplePage variant={variant} />} />
        <Route path="/people/radia-perlman" element={<h1>Radia Perlman profile</h1>} />
      </Routes>
    </MemoryRouter>,
  )

  return user
}

function directoryLinks() {
  const list = screen.getByRole('list', { name: 'Computing pioneers' })
  return within(list).getAllByRole('link')
}

describe('PeoplePage', () => {
  it('reuses the directory, keyboard search, and result status in compact mode', async () => {
    const user = renderDirectory('compact')

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'People' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Ada Lovelace' })).toBeVisible()
    expect(directoryLinks()).toHaveLength(6)

    await user.tab()
    const input = screen.getByRole('searchbox', { name: 'Search by name' })
    expect(input).toHaveFocus()

    await user.keyboard('  rA  ')
    expect(directoryLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/people/grace-hopper',
      '/people/radia-perlman',
    ])

    await user.clear(input)
    await user.keyboard('nonexistent')
    expect(screen.getByRole('status')).toHaveTextContent('No people match your search.')
    expect(input).toHaveFocus()
  })


  it.each(['/people/ada-lovelace', '/people/ada-lovelace/'])(
    'marks only the selected profile card current at %s',
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <PeoplePage variant="compact" />
        </MemoryRouter>,
      )

      const list = screen.getByRole('list', { name: 'Computing pioneers' })
      const current = within(list).getAllByRole('link', { current: 'page' })
      expect(current).toEqual([within(list).getByRole('link', { name: 'Ada Lovelace' })])
      expect(directoryLinks().every((link) => !link.hasAttribute('aria-pressed'))).toBe(true)
    },
  )

  it('leaves the cards unselected for an invalid case-sensitive profile ID', () => {
    render(
      <MemoryRouter initialEntries={['/people/ADA-LOVELACE']}>
        <PeoplePage variant="compact" />
      </MemoryRouter>,
    )

    const list = screen.getByRole('list', { name: 'Computing pioneers' })
    expect(within(list).queryByRole('link', { current: 'page' })).not.toBeInTheDocument()
  })

  it('shows six named cards in fixture order with valid profile URLs', () => {
    renderDirectory()

    expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
    expect(screen.getByRole('searchbox', { name: 'Search by name' })).toHaveValue('')
    const links = directoryLinks()

    expect(links).toHaveLength(6)
    people.forEach(({ id, name }, index) => {
      expect(links[index]).toHaveAccessibleName(name)
      expect(links[index]).toHaveAttribute('href', '/people/' + id)
    })
  })

  it('filters by partial name regardless of case and surrounding whitespace', async () => {
    const user = renderDirectory()
    const input = screen.getByRole('searchbox', { name: 'Search by name' })

    await user.type(input, '  rA  ')

    expect(directoryLinks()).toEqual([
      screen.getByRole('link', { name: 'Grace Hopper' }),
      screen.getByRole('link', { name: 'Radia Perlman' }),
    ])
    expect(input).toHaveValue('  rA  ')
    expect(input).toHaveFocus()
  })

  it('restores the initial cards when the query is cleared or contains only whitespace', async () => {
    const user = renderDirectory()
    const input = screen.getByRole('searchbox', { name: 'Search by name' })

    await user.type(input, 'turing')
    expect(directoryLinks()).toEqual([screen.getByRole('link', { name: 'Alan Turing' })])

    await user.clear(input)
    expect(directoryLinks()).toHaveLength(6)

    await user.type(input, '   ')
    expect(directoryLinks()).toHaveLength(6)
  })

  it('announces the empty result and restores the list when the query changes', async () => {
    const user = renderDirectory()
    const input = screen.getByRole('searchbox', { name: 'Search by name' })

    await user.type(input, 'no matching pioneer')

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('No people match your search. Try a different name.')
    expect(screen.queryByRole('list', { name: 'Computing pioneers' })).not.toBeInTheDocument()
    expect(input).toHaveFocus()

    await user.clear(input)
    expect(status).toBeEmptyDOMElement()
    expect(directoryLinks()).toHaveLength(6)
  })

  it('supports typing a search and opening the matching profile by keyboard', async () => {
    const user = renderDirectory()

    await user.tab()
    expect(screen.getByRole('searchbox', { name: 'Search by name' })).toHaveFocus()
    await user.keyboard('perlman')
    await user.tab()

    expect(screen.getByRole('link', { name: 'Radia Perlman' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('heading', { name: 'Radia Perlman profile' })).toBeVisible()
  })
})
