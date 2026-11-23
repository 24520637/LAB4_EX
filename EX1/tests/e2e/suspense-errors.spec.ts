import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const manifest = JSON.parse(readFileSync(resolve('dist/.vite/manifest.json'), 'utf8')) as Record<string, {file: string}>
function chunkFor(name: string): string {
  const file = manifest[`src/pages/${name}Page.tsx`]?.file
  if (!file) throw new Error(`Missing ${name} manifest chunk`)
  return file
}
function deferred() {
  let release!: () => void
  const promise = new Promise<void>((resolvePromise) => { release = resolvePromise })
  return { promise, release }
}

for (const { name, route, expected, skeleton } of [
  { name: 'People', route: '/people', expected: 'People', skeleton: 'people-skeleton' },
  { name: 'Person', route: '/people/ada-lovelace', expected: 'Ada Lovelace', skeleton: 'person-skeleton' },
]) {
  test(`${name} chunk stays pending with skeleton, then resolves without losing navigation`, async ({ page }, testInfo) => {
    const chunk = chunkFor(name)
    const gate = deferred()
    const intercepted = deferred()
    let held = false
    await page.route(`**/${chunk}`, async (routeHandler) => {
      held = true
      intercepted.release()
      await gate.promise
      await routeHandler.continue()
    })
    try {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
      // SPA transition on a cold module, without using a production setTimeout.
      if (name === 'People') {
        await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
      } else {
        // First navigate to People, then the person link (Person JS remains unvisited).
        await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
        await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
        await page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Ada Lovelace' }).click()
      }
      await intercepted.promise
      expect(held).toBe(true)
      await expect(page.getByTestId(skeleton)).toBeVisible()
      await expect(page.locator('main section[aria-busy="true"]')).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
      await expect(page.getByRole('status').first()).toContainText(/Loading/i)
      gate.release()
      await expect(page.getByRole('heading', { level: 1, name: expected })).toBeVisible()
      await expect(page.getByTestId(skeleton)).toHaveCount(0)
      await expect(page.locator('main section[aria-busy="true"]')).toHaveCount(0)
      await testInfo.attach(`delayed-${name.toLowerCase()}-chunk.json`, {
        body: JSON.stringify({ route, chunk, intercepted: held }), contentType: 'application/json',
      })
    } finally {
      gate.release()
    }
  })
}

test('rejected chunk renders an accessible error and offers full reload and Home', async ({ page }) => {
  const chunk = chunkFor('People')
  let rejected = 0
  await page.route(`**/${chunk}`, async (routeHandler) => {
    rejected += 1
    await routeHandler.abort('failed')
  })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
  await expect(page.getByRole('alert')).toContainText('This page couldn’t load')
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  expect(rejected).toBeGreaterThan(0)
  await expect(page.getByRole('status').first()).toBeEmpty()
  // A different route clears the visual error via the route identity.
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
})

test('nested Person chunk failure shows one recoverable alert and retains primary navigation', async ({ page }) => {
  let blocked = 0
  await page.route(`**/${chunkFor('Person')}`, async (request) => { blocked++; await request.abort('failed') })
  await page.goto('/people')
  await page.getByRole('list', { name: 'Computing pioneers' }).getByRole('link', { name: 'Ada Lovelace' }).click()
  await expect(page.getByRole('alert')).toContainText('This page couldn’t load')
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  expect(blocked).toBeGreaterThan(0)
  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
})
