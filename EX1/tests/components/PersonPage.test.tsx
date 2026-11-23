import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'
import { people } from '../../src/data/people'
import PersonPage from '../../src/pages/PersonPage'
import PeoplePage from '../../src/pages/PeoplePage'
import PeopleLayout from '../../src/components/people/PeopleLayout'

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


function NestedHistoryActions() {
  const navigate = useNavigate()
  return (
    <nav aria-label="Test history controls">
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </nav>
  )
}

function renderNestedDetail(initialPath: string) {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/people', initialPath]} initialIndex={1}>
      <NestedHistoryActions />
      <Routes>
        <Route path="people" element={<PeopleLayout directory={<PeoplePage variant="compact" />} />}>
          <Route index element={<p>Select a pioneer to view their profile.</p>} />
          <Route path=":personId" element={<PersonPage />} />
        </Route>
        <Route path="*" element={<h1>Global page not found</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return user
}

describe('PersonPage nested Master–Detail contract (Exercise 1.2)', () => {
  it.each(people)('resolves nested useParams and semantic metadata for $id', ({ id, name, era, field, summary, contributions }) => {
    renderNestedDetail(`/people/${id}`)
    const detail = screen.getByRole('region', { name: 'Pioneer details' })
    const master = screen.getByRole('region', { name: 'Pioneer directory' })
    expect(within(master).getByRole('heading', { level: 2, name: 'People' })).toBeVisible()
    expect(within(detail).getByRole('heading', { level: 1, name })).toBeVisible()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const metadata = detail.querySelector('dl')
    expect(metadata).not.toBeNull()
    const pairs = [...metadata!.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent])
    expect(pairs).toEqual([['Era', era], ['Field', field]])
    expect(within(detail).getByText(summary)).toBeVisible()
    const contributionsList = within(within(detail).getByRole('region', { name: 'Contributions' })).getByRole('list')
    expect(within(contributionsList).getAllByRole('listitem').map((li) => li.textContent)).toEqual(contributions)
    expect(within(master).getByRole('link', { name })).toHaveAttribute('href', `/people/${id}`)
  })

  it.each(['/people/missing-person', '/people/ADA-LOVELACE', '/people/%20'])('keeps an invalid ID inside the detail outlet: %s', (path) => {
    renderNestedDetail(path)
    const detail = screen.getByRole('region', { name: 'Pioneer details' })
    expect(within(detail).getByRole('heading', { level: 1, name: 'Profile not found' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Global page not found' })).not.toBeInTheDocument()
    expect(within(detail).getByRole('link', { name: 'Back to people directory' })).toHaveAttribute('href', '/people')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('preserves master navigation and recovers via native link, including browser Back', async () => {
    const user = renderNestedDetail('/people/ada-lovelace')
    const master = screen.getByRole('region', { name: 'Pioneer directory' })
    expect(within(master).getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(master).getByRole('link', { name: 'Grace Hopper' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeVisible()
    expect(within(master).getByRole('link', { name: 'Grace Hopper' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Back to people directory' }))
    expect(screen.getByText('Select a pioneer to view their profile.')).toBeVisible()
  })
})
