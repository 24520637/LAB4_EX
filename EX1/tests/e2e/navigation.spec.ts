import { expect, test } from '@playwright/test'

// Each test creates a fresh, service-worker-free context through the Playwright fixture.
test('direct URLs resolve for all five route patterns and invalid profiles', async ({ page }) => {
  const cases = [
    { path: '/', heading: 'Pioneer Atlas' },
    { path: '/people', heading: 'People' },
    { path: '/people/ada-lovelace', heading: 'Ada Lovelace' },
    { path: '/about', heading: 'About Pioneer Atlas' },
    { path: '/does-not-exist', heading: '404 Page not found' },
    { path: '/people/no-such-person', heading: 'Profile not found' },
  ]
  for (const { path, heading } of cases) {
    await page.goto(path)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  }
})

test('native navigation, person links, and browser history do not reload documents', async ({ page }) => {
  await page.goto('/')
  let documentRequests = 0
  page.on('request', (request) => {
    if (request.resourceType() === 'document') documentRequests += 1
  })

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
  await page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Ada Lovelace' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
  expect(documentRequests, 'client-side navigation must not request a new document').toBe(0)
})

test('404 recovery links lead to valid destinations', async ({ page }) => {
  await page.goto('/unknown-route')
  await page.getByRole('navigation', { name: 'Recovery' }).getByRole('link', { name: 'People' }).click()
  await expect(page).toHaveURL(/\/people$/)
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
})

// Exercise 1.2: each direct detail URL must keep the directory master and Outlet detail.
const personSlugs = [
  ['ada-lovelace', 'Ada Lovelace'],
  ['alan-turing', 'Alan Turing'],
  ['grace-hopper', 'Grace Hopper'],
  ['margaret-hamilton', 'Margaret Hamilton'],
  ['donald-knuth', 'Donald Knuth'],
  ['radia-perlman', 'Radia Perlman'],
] as const

for (const [slug, name] of personSlugs) {
  test(`nested deep link ${slug} preserves master and detail`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/people/${slug}`)
    await expect(page.getByRole('region', { name: 'Pioneer directory', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pioneer details' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 2, name: 'People' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search by name' })).toBeVisible()
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' })).toHaveAttribute('aria-current', 'page')
    expect(errors, `uncaught browser exceptions at ${slug}`).toEqual([])
  })
}

test('master search survives detail selection, history Back/Forward, and URL stays client-side', async ({ page }) => {
  await page.goto('/people')
  const search = page.getByRole('searchbox', { name: 'Search by name' })
  await search.fill('grace')
  await expect(page.getByRole('list', { name: 'Computing pioneers' }).getByRole('listitem')).toHaveCount(1)
  let newDocuments = 0
  page.on('request', (request) => { if (request.isNavigationRequest() && request.resourceType() === 'document') newDocuments++ })
  await page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Grace Hopper' }).click()
  await expect(page).toHaveURL(/\/people\/grace-hopper$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeVisible()
  await expect(search).toHaveValue('grace')
  await page.goBack()
  await expect(page).toHaveURL(/\/people$/)
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { level: 1, name: 'Grace Hopper' })).toBeVisible()
  expect(newDocuments).toBe(0)
})

test('bad profile stays within nested details; unrelated bad URL shows global recovery', async ({ page }) => {
  await page.goto('/people/nonexistent-id')
  await expect(page.getByRole('region', { name: 'Pioneer directory', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Pioneer details' })).toContainText('Profile not found')
  await expect(page.locator('main h1')).toHaveCount(1)
  await page.getByRole('link', { name: 'Back to people directory' }).click()
  await expect(page).toHaveURL(/\/people$/)
  await page.goto('/not-a-pioneer-route')
  await expect(page.getByRole('heading', { level: 1, name: /404/i })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Recovery' }).getByRole('link', { name: 'People' })).toBeVisible()
})
