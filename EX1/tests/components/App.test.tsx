import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../../src/app/App'

describe('App foundation smoke test', () => {
  it('renders the application heading inside its main landmark', async () => {
    render(<App />)

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Pioneer Atlas' }),
    ).toBeVisible()
  })
})
