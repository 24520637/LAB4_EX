import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

type ManifestEntry = {
  file: string
  isEntry?: boolean
  isDynamicEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
}
const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'dist/.vite/manifest.json'), 'utf8'),
) as Record<string, ManifestEntry>

function pageChunk(name: string): ManifestEntry {
  const entry = manifest[`src/pages/${name}Page.tsx`]
  if (!entry?.isDynamicEntry || !entry.file.endsWith('.js')) {
    throw new Error(`Missing dynamic page chunk: ${name}`)
  }
  return entry
}

test('all five pages have distinct production JS chunks', () => {
  const entries = ['Overview', 'People', 'Person', 'About', 'NotFound'].map(pageChunk)
  expect(new Set(entries.map((entry) => entry.file)).size).toBe(5)
  for (const entry of entries) expect(statSync(resolve('dist', entry.file)).size).toBeGreaterThan(0)
})

test('initial graph omits People and fetches it after first navigation', async ({ page }, testInfo) => {
  const people = pageChunk('People')
  const overview = pageChunk('Overview')
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().split('?')[0].endsWith('.js')) requests.push(request.url())
  })
  const chunkFetched = (file: string) => requests.some((url) => new URL(url).pathname.endsWith(`/${file}`))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Pioneer Atlas' })).toBeVisible()
  expect(chunkFetched(overview.file), 'overview should load on the initial route').toBe(true)
  expect(chunkFetched(people.file), 'People must not preload on initial / visit').toBe(false)
  const initialRequests = [...requests]

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'People' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'People' })).toBeVisible()
  expect(chunkFetched(people.file), 'People must load on first navigation').toBe(true)
  await testInfo.attach('cold-route-js-requests.json', {
    body: JSON.stringify({ peopleChunk: people.file, bytes: statSync(resolve('dist', people.file)).size, initialRequests, afterNavigation: requests }, null, 2),
    contentType: 'application/json',
  })
})

test('five distinct dynamic entries remain outside the initial static import closure', () => {
  const entryPairs = ['Overview', 'People', 'Person', 'About', 'NotFound'].map((name) => [name, pageChunk(name)] as const)
  const emitted = entryPairs.map(([, chunk]) => chunk.file)
  expect(new Set(emitted).size).toBe(5)
  const visited = new Set<string>()
  const traverse = (key: string) => {
    if (visited.has(key)) return
    visited.add(key)
    for (const dependency of manifest[key]?.imports ?? []) traverse(dependency)
  }
  for (const [key, entry] of Object.entries(manifest)) if (entry.isEntry) traverse(key)
  for (const [name] of entryPairs) {
    expect(visited.has(`src/pages/${name}Page.tsx`), `${name} page must be lazy`).toBe(false)
  }
})

test('cold detail load requests People and Person but not unrelated route chunks', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'block' })
  try {
    const page = await context.newPage()
    const js = new Set<string>()
    page.on('request', (request) => { if (request.url().split('?')[0].endsWith('.js')) js.add(new URL(request.url()).pathname) })
    await page.goto('/people/ada-lovelace')
    await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
    const got = (name: string) => [...js].some((url) => url.endsWith('/' + pageChunk(name).file))
    expect(got('People')).toBe(true)
    expect(got('Person')).toBe(true)
    for (const unused of ['Overview', 'About', 'NotFound']) expect(got(unused), `${unused} loaded eagerly`).toBe(false)
  } finally {
    await context.close()
  }
})
