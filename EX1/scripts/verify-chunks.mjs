#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = path.join(projectRoot, 'dist')
const manifestPath = path.join(distRoot, '.vite', 'manifest.json')
const expectedPages = [
  'OverviewPage',
  'PeoplePage',
  'PersonPage',
  'AboutPage',
  'NotFoundPage',
].map((name) => `src/pages/${name}.tsx`)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function staticClosure(manifest, initialKeys) {
  const seen = new Set()
  const pending = [...initialKeys]
  while (pending.length > 0) {
    const key = pending.pop()
    if (seen.has(key)) continue
    const entry = manifest[key]
    assert(entry && typeof entry === 'object', `Missing static import manifest entry: ${key}`)
    seen.add(key)
    for (const importedKey of entry.imports ?? []) pending.push(importedKey)
  }
  return seen
}

async function main() {
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read production manifest at ${manifestPath}; run npm run build first. ${error.message}`)
  }
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Manifest must be a JSON object')

  const initialKeys = Object.keys(manifest).filter((key) => manifest[key]?.isEntry === true)
  assert(initialKeys.length > 0, 'No initial application entry found (isEntry: true)')
  const eagerKeys = staticClosure(manifest, initialKeys)
  const lazyKeys = new Set()
  const pending = [...eagerKeys]
  for (const key of pending) {
    const entry = manifest[key]
    for (const importedKey of entry.dynamicImports ?? []) lazyKeys.add(importedKey)
  }
  const emittedFiles = new Set()
  const records = []

  for (const key of expectedPages) {
    const page = manifest[key]
    assert(page && typeof page === 'object', `Missing page manifest entry: ${key}`)
    assert(page.isDynamicEntry === true, `Page is not a dynamic entry: ${key}`)
    assert(typeof page.file === 'string' && page.file.endsWith('.js'), `Invalid emitted JS file for ${key}`)
    assert(!emittedFiles.has(page.file), `Two pages share an emitted JS file: ${page.file}`)
    emittedFiles.add(page.file)
    assert(!eagerKeys.has(key), `Page reachable from initial static import graph: ${key}`)
    assert(![...eagerKeys].some((eagerKey) => manifest[eagerKey]?.file === page.file),
      `Page JS bundled into an initial static chunk: ${key} (${page.file})`)
    assert(lazyKeys.has(key), `Page is not a dynamic import from the initial static graph: ${key}`)

    const target = path.resolve(distRoot, page.file)
    assert(target.startsWith(distRoot + path.sep), `Invalid emitted file path: ${page.file}`)
    const fileStat = await stat(target)
    assert(fileStat.isFile(), `Emitted chunk is not a file: ${page.file}`)
    records.push({ key, file: page.file, bytes: fileStat.size })
  }

  console.log(`Verified ${records.length} distinct dynamic page chunks; none statically reachable from ${initialKeys.length} initial entry/entries.`)
  console.log(`Initial static graph: ${[...eagerKeys].join(', ')}`)
  for (const { key, file, bytes } of records) console.log(`${key} -> ${file} (${bytes} bytes)`)
}

main().catch((error) => {
  console.error(`Chunk verification FAILED: ${error.message}`)
  process.exitCode = 1
})
