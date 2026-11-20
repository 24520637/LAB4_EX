import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from '../../src/pages/AboutPage'

const sectionNames = ['Project purpose', 'Code splitting', 'Performance limitations']

describe('AboutPage', () => {
  it('renders one page heading and three named sections in reading order', () => {
    render(<AboutPage />)

    const title = screen.getByRole('heading', { level: 1, name: 'About Pioneer Atlas' })
    expect(screen.getAllByRole('heading', { level: 1 })).toEqual([title])
    expect(screen.getAllByRole('region')).toHaveLength(3)
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(sectionNames)

    for (const name of sectionNames) {
      const section = screen.getByRole('region', { name })
      expect(within(section).getByRole('heading', { level: 2, name })).toBeVisible()
    }
  })

  it('explains that profiles are bundled locally and route JavaScript loads on demand', () => {
    render(<AboutPage />)

    const purpose = screen.getByRole('region', { name: 'Project purpose' })
    const splitting = screen.getByRole('region', { name: 'Code splitting' })
    expect(within(purpose).getByText(/profile content is bundled locally/i)).toBeVisible()
    expect(within(splitting).getByText(/load each route’s javascript on demand/i)).toBeVisible()
  })

  it('describes controlled measurements and states that zero CLS is a target', () => {
    render(<AboutPage />)

    const limitations = screen.getByRole('region', { name: 'Performance limitations' })
    expect(within(limitations).getByText(/viewport and network conditions/i)).toBeVisible()
    expect(within(limitations).getByText(/CLS = 0 is a target/i)).toBeVisible()
  })
})
