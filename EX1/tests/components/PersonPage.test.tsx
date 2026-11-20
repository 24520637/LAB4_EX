import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { people } from '../../src/data/people'
import PersonPage from '../../src/pages/PersonPage'

function renderDetail(path: string) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/people/:personId" element={<PersonPage />} />
        <Route path="/people" element={<h1>People</h1>} />
      </Routes>
    </MemoryRouter>,
  )

  return user
}

function expectMissingProfile() {
  const heading = screen.getByRole('heading', { level: 1, name: 'Profile not found' })
  expect(screen.getAllByRole('heading', { level: 1 })).toEqual([heading])
  expect(screen.getByText('We couldn’t find a profile for this link.')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Back to people directory' })).toHaveAttribute('href', '/people')
  expect(screen.queryByRole('heading', { name: 'Contributions' })).not.toBeInTheDocument()
}

describe('PersonPage', () => {
  it.each(people)('displays the complete profile for $name', ({ id, name, era, field, summary, contributions }) => {
    renderDetail('/people/' + id)

    const heading = screen.getByRole('heading', { level: 1, name })
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([heading])
    expect(screen.getByText('Era', { selector: 'dt' })).toBeVisible()
    expect(screen.getByText('Field', { selector: 'dt' })).toBeVisible()
    expect(screen.getByText(era, { selector: 'dd' })).toBeVisible()
    expect(screen.getByText(field, { selector: 'dd' })).toBeVisible()

    const biography = screen.getByRole('region', { name: 'Biography' })
    expect(within(biography).getByText(summary)).toBeVisible()

    const contributionSection = screen.getByRole('region', { name: 'Contributions' })
    const list = within(contributionSection).getByRole('list')
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(contributions)
    expect(screen.getByRole('link', { name: 'Back to people directory' })).toHaveAttribute('href', '/people')
  })

  it.each(['/people/unknown-pioneer', '/people/ADA-LOVELACE'])(
    'shows a recovery state for %s',
    (path) => {
      renderDetail(path)

      expectMissingProfile()
    },
  )

  it('shows the recovery state if the route supplies no person ID', () => {
    render(
      <MemoryRouter initialEntries={['/people']}>
        <Routes>
          <Route path="/people/:personId?" element={<PersonPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expectMissingProfile()
  })

  it('returns to the directory from an invalid profile using Tab and Enter', async () => {
    const user = renderDetail('/people/unknown-pioneer')

    await user.tab()
    expect(screen.getByRole('link', { name: 'Back to people directory' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
  })
})
