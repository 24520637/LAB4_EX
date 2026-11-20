import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { getPersonById, people } from '../../src/data/people'
import OverviewPage from '../../src/pages/OverviewPage'

const featured = [
  { id: 'ada-lovelace', name: 'Ada Lovelace', initials: 'AL' },
  { id: 'alan-turing', name: 'Alan Turing', initials: 'AT' },
  { id: 'grace-hopper', name: 'Grace Hopper', initials: 'GH' },
]

function renderOverview() {
  render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>,
  )
}

describe('OverviewPage', () => {
  it('introduces the directory under one page heading', () => {
    renderOverview()

    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([
      screen.getByRole('heading', { level: 1, name: 'Pioneer Atlas' }),
    ])
    expect(screen.getByText('Explore ' + people.length + ' computing pioneers', { exact: false })).toBeVisible()
  })

  it('renders exactly three featured links with descriptive names and valid profile URLs', () => {
    renderOverview()

    const section = screen.getByRole('region', { name: 'Featured pioneers' })
    const links = within(section).getAllByRole('link')

    expect(links).toHaveLength(3)
    for (const { id, name } of featured) {
      const person = getPersonById(id)
      expect(person?.name).toBe(name)
      const link = within(section).getByRole('link', { name, exact: true })
      expect(link).toHaveAttribute('href', '/people/' + id)
      expect(within(link).getByRole('heading', { level: 3, name })).toBeVisible()
    }
  })

  it('uses fixture summaries and fields and hides decorative initials from assistive technology', () => {
    renderOverview()

    for (const { id, name, initials } of featured) {
      const person = getPersonById(id)
      if (!person) throw new Error('Missing featured fixture: ' + id)
      const card = within(screen.getByRole('link', { name, exact: true }))

      expect(card.getByText(person.field)).toBeVisible()
      expect(card.getByText(person.summary)).toBeVisible()
      expect(card.getByText(initials)).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
