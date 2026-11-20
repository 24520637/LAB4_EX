import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/app/App'
import AppLayout from '../../src/app/AppLayout'

describe('App shell', () => {
  it('renders one main landmark between the banner and contentinfo', async () => {
    render(<App />)

    const banner = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')

    expect(main).toHaveAttribute('id', 'main-content')
    expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(await within(main).findByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
  })
})

describe('AppLayout', () => {
  it('renders children inside main and places the footer outside the slot', () => {
    render(
      <AppLayout>
        <h1>Test page</h1>
        <p>Page content</p>
      </AppLayout>,
    )

    const main = screen.getByRole('main')

    expect(within(main).getByRole('heading', { name: 'Test page' })).toBeVisible()
    expect(within(main).getByText('Page content')).toBeVisible()
    expect(main).not.toContainElement(screen.getByRole('contentinfo'))
  })

  it('keeps the same landmarks when the child content is replaced', () => {
    const { rerender } = render(<AppLayout><p>Initial page</p></AppLayout>)
    const banner = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')

    rerender(<AppLayout><h1>Next page</h1></AppLayout>)

    expect(screen.getByRole('banner')).toBe(banner)
    expect(screen.getByRole('main')).toBe(main)
    expect(screen.getByRole('contentinfo')).toBe(footer)
    expect(within(main).queryByText('Initial page')).not.toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: 'Next page' })).toBeVisible()
  })
})
