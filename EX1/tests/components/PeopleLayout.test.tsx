import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import PeopleLayout from '../../src/components/people/PeopleLayout'
import styles from '../../src/components/people/PeopleLayout.module.css'

function renderLayout(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <main>
        <Routes>
          <Route path="people" element={<PeopleLayout directory={<p>Directory slot</p>} />}>
            <Route index element={<p>Select a pioneer to view their profile.</p>} />
            <Route path=":personId" element={<h1>Ada Lovelace</h1>} />
          </Route>
        </Routes>
      </main>
    </MemoryRouter>,
  )
}

describe('PeopleLayout', () => {
  it.each([
    ['/people', 'Select a pioneer to view their profile.', 'directory'],
    ['/people/ada-lovelace', 'Ada Lovelace', 'profile'],
  ])('renders a persistent directory slot and the nested content at %s', (path, detail, view) => {
    renderLayout(path)
    expect(screen.getAllByRole('main')).toHaveLength(1)

    const layout = screen.getByRole('region', { name: 'Pioneer directory and details' })
    const directory = within(layout).getByRole('region', { name: 'Pioneer directory' })
    const details = within(layout).getByRole('region', { name: 'Pioneer details' })

    expect(within(directory).getByText('Directory slot')).toBeVisible()
    expect(within(details).getByText(detail)).toBeVisible()
    expect(directory.nextElementSibling).toBe(details)
    expect(layout).toHaveAttribute('data-view', view)
    expect(directory.parentElement).toHaveClass(styles.panels)
  })
})
