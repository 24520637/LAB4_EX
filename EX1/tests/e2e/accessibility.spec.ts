import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const manifest = JSON.parse(readFileSync(resolve('dist/.vite/manifest.json'), 'utf8')) as Record<string, {file: string}>
function pageChunk(name: string) {
  const file = manifest[`src/pages/${name}Page.tsx`]?.file
  if (!file) throw new Error(`Missing production chunk: ${name}`)
  return file
}

for (const { path, heading } of [
  { path: '/', heading: 'Pioneer Atlas' },
  { path: '/people', heading: 'People' },
  { path: '/people/ada-lovelace', heading: 'Ada Lovelace' },
  { path: '/about', heading: 'About Pioneer Atlas' },
  { path: '/people/bad-id', heading: 'Profile not found' },
  { path: '/unknown-route', heading: '404 Page not found' },
]) {
  test(`axe WCAG A/AA audit ${path}`, async ({ page }, testInfo) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    await testInfo.attach('axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
    expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target }) => target) }))).toEqual([])
  })
}

test('keyboard skip link targets main without trapping focus', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: /skip to (main )?content/i })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Ada Lovelace' })).toBeFocused()
})

test('client-side navigation and browser Back focus the resolved page heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).not.toBeFocused()
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
  const directoryHeading = page.getByRole('heading', { level: 1, name: 'People' })
  await expect(directoryHeading).toBeVisible()
  await expect(directoryHeading).toBeFocused()
  await page.goBack()
  const overviewHeading = page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })
  await expect(overviewHeading).toBeVisible()
  await expect(overviewHeading).toBeFocused()
})

test('cold loading has busy semantics, decorative skeleton, one persistent status; reduced motion disables effects', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let release!: () => void
  const hold = new Promise<void>((done) => { release = done })
  const chunk = pageChunk('People')
  await page.route(`**/${chunk}`, async (routeHandler) => {
    await hold
    await routeHandler.continue()
  })
  try {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
    const status = page.getByRole('status').first()
    await expect(status).toContainText(/Loading people/i)
    await expect(page.getByRole('status')).toHaveCount(1)
    await expect(page.locator('main section[aria-busy="true"]')).toBeVisible()
    const skeleton = page.getByTestId('people-skeleton')
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    await expect(skeleton.locator('a, button, input, [tabindex]:not([tabindex="-1"])')).toHaveCount(0)
    const motion = await skeleton.locator('[class*="shape"]').first().evaluate((node) => {
      const style = window.getComputedStyle(node)
      return { animation: style.animationName, duration: style.animationDuration, transition: style.transitionDuration }
    })
    expect(motion.animation).toBe('none')
    expect(motion.transition).toMatch(/^(0s|0ms)(,\s*(0s|0ms))*$/)
    release()
    await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
    await expect(page.locator('main section[aria-busy="true"]')).toHaveCount(0)
    await expect(status).toContainText(/People loaded/i)
  } finally {
    release()
  }
})

for (const route of ['/people', '/people/ada-lovelace', '/people/not-an-id']) {
  test(`nested people accessibility and axe: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route)
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'Pioneer directory', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pioneer details' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search by name' })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    await testInfo.attach('nested-axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
    expect(results.violations).toEqual([])
  })
}

test('nested route keyboard selection and focus on the detail heading', async ({ page }) => {
  await page.goto('/people')
  const search = page.getByRole('searchbox', { name: 'Search by name' })
  await search.focus()
  await search.fill('Ada')
  await page.keyboard.press('Tab')
  const chosen = page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Ada Lovelace' })
  await expect(chosen).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeFocused()
  await expect(page.getByRole('heading', { level: 2, name: 'People' })).not.toBeFocused()
  await expect(search).toHaveValue('Ada')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeFocused()
})

test('nested loading has one persistent status, busy region, and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const chunk = pageChunk('Person')
  let release!: () => void
  const gate = new Promise<void>((resolveGate) => { release = resolveGate })
  let intercepted!: () => void
  const seen = new Promise<void>((resolveSeen) => { intercepted = resolveSeen })
  await page.route(`**/${chunk}`, async (request) => { intercepted(); await gate; await request.continue() })
  try {
    await page.goto('/people')
    await page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Ada Lovelace' }).click()
    await seen
    await expect(page.getByTestId('person-skeleton')).toBeVisible()
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(1)
    const statuses = page.getByRole('status')
    await expect(statuses.first()).toContainText(/loading/i)
    await expect(page.getByTestId('person-skeleton')).toHaveAttribute('aria-hidden', 'true')
    const animations = await page.getByTestId('person-skeleton').locator('*').evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName))
    expect(animations.every((name) => name === 'none')).toBe(true)
    release()
    await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
  } finally { release() }
})
