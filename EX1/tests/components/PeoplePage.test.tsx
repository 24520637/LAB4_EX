import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { people } from '../../src/data/people'
import PeoplePage from '../../src/pages/PeoplePage'

function renderDirectory() {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/people']}>
      <Routes>
        <Route path="/people" element={<PeoplePage />} />
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
