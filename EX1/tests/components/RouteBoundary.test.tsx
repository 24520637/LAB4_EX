import { lazy, type ComponentType } from 'react'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RouteBoundary from '../../src/components/routing/RouteBoundary'

function createDeferredComponent() {
  let resolve!: (value: { default: ComponentType }) => void
  const promise = new Promise<{ default: ComponentType }>((complete) => {
    resolve = complete
  })
  const Page = lazy(() => promise)
  return { Page, resolve }
}

describe('RouteBoundary', () => {
  it('shows the route fallback while a child suspends and replaces it when resolved', async () => {
    const { Page, resolve } = createDeferredComponent()
    render(
      <RouteBoundary label="profile" fallback={<p>Loading profile…</p>}>
        <Page />
      </RouteBoundary>,
    )

    expect(screen.getByText('Loading profile…')).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Resolved profile' })).not.toBeInTheDocument()

    resolve({ default: () => <h1>Resolved profile</h1> })
    await waitForElementToBeRemoved(() => screen.queryByText('Loading profile…'))
    expect(await screen.findByRole('heading', { name: 'Resolved profile' })).toBeVisible()
  })

  it('keeps navigation outside the suspended region mounted and usable', async () => {
    const { Page, resolve } = createDeferredComponent()
    render(
      <>
        <nav aria-label="Primary"><a href="/people">People</a></nav>
        <main>
          <RouteBoundary label="people" fallback={<p>Loading people…</p>}>
            <Page />
          </RouteBoundary>
        </main>
      </>,
    )
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const peopleLink = screen.getByRole('link', { name: 'People' })
    expect(peopleLink).toHaveAttribute('href', '/people')
    expect(screen.getByText('Loading people…')).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(nav)

    resolve({ default: () => <h1>People directory</h1> })
    expect(await screen.findByRole('heading', { name: 'People directory' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBe(nav)
    expect(screen.getByRole('link', { name: 'People' })).toBe(peopleLink)
  })

  it('uses the meaningful label when no explicit fallback is supplied', async () => {
    const { Page, resolve } = createDeferredComponent()
    render(<RouteBoundary label="about"><Page /></RouteBoundary>)
    expect(screen.getByText('Loading about…')).toBeVisible()
    resolve({ default: () => <h1>About</h1> })
    expect(await screen.findByRole('heading', { name: 'About' })).toBeVisible()
  })
})
