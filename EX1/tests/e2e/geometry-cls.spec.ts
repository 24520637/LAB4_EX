import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const manifest = JSON.parse(readFileSync(resolve('dist/.vite/manifest.json'), 'utf8')) as Record<string, {file: string}>
function chunkFor(name: string): string {
  const file = manifest[`src/pages/${name}Page.tsx`]?.file
  if (!file) throw new Error(`Missing ${name} chunk in build manifest`)
  return file
}

type Shift = { startTime: number; value: number; hadRecentInput: boolean }
function clsSessionScore(entries: Shift[]): number {
  const eligible = entries.filter((entry) => !entry.hadRecentInput).sort((a, b) => a.startTime - b.startTime)
  let maximum = 0
  let score = 0
  let first = -Infinity
  let previous = -Infinity
  for (const item of eligible) {
    if (item.startTime - previous >= 1000 || item.startTime - first >= 5000) {
      score = 0
      first = item.startTime
    }
    score += item.value
    maximum = Math.max(maximum, score)
    previous = item.startTime
  }
  return maximum
}

test.describe('production geometry and actual layout shifts', () => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    for (const { name, path, heading, skeleton } of [
      { name: 'Overview', path: '/', heading: 'Pioneer Atlas', skeleton: 'overview-skeleton' },
      { name: 'People', path: '/people', heading: 'People', skeleton: 'people-skeleton' },
      { name: 'Person', path: '/people/ada-lovelace', heading: 'Ada Lovelace', skeleton: 'person-skeleton' },
      { name: 'About', path: '/about', heading: 'About Pioneer Atlas', skeleton: 'about-skeleton' },
    ]) {
      test(`${viewport.width}px ${name}: compare skeleton and loaded geometry and report CLS`, async ({ browser }, testInfo) => {
        const context = await browser.newContext({ viewport, serviceWorkers: 'block' })
        const page = await context.newPage()
        const chunk = chunkFor(name)
        let release!: () => void
        const gate = new Promise<void>((done) => { release = done })
        let intercepted!: () => void
        const interceptedPromise = new Promise<void>((done) => { intercepted = done })
        await page.addInitScript(() => {
          type LayoutEntry = PerformanceEntry & { value: number; hadRecentInput: boolean }
          const store = window as typeof window & { __layoutShifts?: Shift[] }
          store.__layoutShifts = []
          if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
            throw new Error('Layout shift observation is unavailable')
          }
          try {
            new PerformanceObserver((list) => {
              for (const item of list.getEntries() as LayoutEntry[]) {
                store.__layoutShifts?.push({ startTime: item.startTime, value: item.value, hadRecentInput: item.hadRecentInput })
              }
            }).observe({ type: 'layout-shift', buffered: true })
          } catch (error) { throw new Error('Could not observe layout shifts', { cause: error }) }
        })
        await page.route(`**/${chunk}`, async (routeHandler) => {
          intercepted()
          await gate
          await routeHandler.continue()
        })
        try {
          // On a cold direct URL, the entire document's first route is suspended.
          const navigation = page.goto(path, { waitUntil: 'domcontentloaded' })
          await interceptedPromise
          await navigation
          const shape = page.getByTestId(skeleton)
          await expect(shape).toBeVisible()
          const skeletonRect = await page.locator('main > :first-child').boundingBox()
          expect(skeletonRect).not.toBeNull()
          const decorative = await shape.getAttribute('aria-hidden')
          expect(decorative).toBe('true')
          release()
          await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
          await expect(shape).toHaveCount(0)
          const loadedRect = await page.locator('main > :first-child').boundingBox()
          expect(loadedRect).not.toBeNull()
          const shiftEntries = await page.evaluate(() => {
            const state = window as typeof window & { __layoutShifts?: Shift[] }
            return state.__layoutShifts ?? []
          })
          const cls = clsSessionScore(shiftEntries)
          const delta = {
            x: Math.abs((loadedRect?.x ?? 0) - (skeletonRect?.x ?? 0)),
            y: Math.abs((loadedRect?.y ?? 0) - (skeletonRect?.y ?? 0)),
            width: Math.abs((loadedRect?.width ?? 0) - (skeletonRect?.width ?? 0)),
            height: Math.abs((loadedRect?.height ?? 0) - (skeletonRect?.height ?? 0)),
          }
          expect(delta.x, `left-edge alignment for ${name}`).toBeLessThanOrEqual(4)
          expect(delta.width, `width alignment for ${name}`).toBeLessThanOrEqual(4)
          const measurement = { viewport, path, chunk, skeletonRect, loadedRect, delta, cls, rawShiftCount: shiftEntries.length, entries: shiftEntries }
          await testInfo.attach(`geometry-${viewport.width}-${name}.json`, { body: JSON.stringify(measurement, null, 2), contentType: 'application/json' })
          console.log('CLS_MEASUREMENT', JSON.stringify({ viewport: viewport.width, path, cls, delta }))
          expect(cls, `measured CLS for ${name} at ${viewport.width}px`).toBeLessThanOrEqual(0.01)
          // Report real box deltas; do not assert identical heights for dynamic text content.
          for (const item of shiftEntries.filter((entry) => !entry.hadRecentInput && entry.value > 0.001)) {
            console.warn('LAYOUT_SHIFT_INVESTIGATE', JSON.stringify({ viewport: viewport.width, path, ...item }))
          }
        } finally {
          release()
          await context.close()
        }
      })
    }
  }
})

// WP12-05: master/detail geometry is distinct from the Exercise 1.1 single-page fallback.
for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`nested master-detail geometry and CLS at ${viewport.width}px`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      await page.addInitScript(() => {
        type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean }
        const windowWithShifts = window as typeof window & { __nestedShiftValues?: Shift[]; __nestedObserverSupported?: boolean }
        windowWithShifts.__nestedShiftValues = []
        windowWithShifts.__nestedObserverSupported = PerformanceObserver.supportedEntryTypes.includes('layout-shift')
        if (windowWithShifts.__nestedObserverSupported) {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as LayoutShift[]) {
              windowWithShifts.__nestedShiftValues?.push({ startTime: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput })
            }
          }).observe({ type: 'layout-shift', buffered: true })
        }
      })
      const chunk = chunkFor('Person')
      let release!: () => void
      const hold = new Promise<void>((resolveHold) => { release = resolveHold })
      let intercepted!: () => void
      const seen = new Promise<void>((resolveSeen) => { intercepted = resolveSeen })
      await page.route(`**/${chunk}`, async (request) => {
        intercepted()
        await hold
        await request.continue()
      })
      try {
        const go = page.goto('/people/ada-lovelace', { waitUntil: 'domcontentloaded' })
        await seen
        await go
        const fallback = page.getByTestId('person-skeleton')
        await expect(fallback).toBeVisible()
        const fallbackRect = await fallback.boundingBox()
        release()
        await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible()
        const master = page.getByRole('region', { name: 'Pioneer directory', exact: true })
        const detail = page.getByRole('region', { name: 'Pioneer details' })
        const [masterRect, detailRect] = await Promise.all([master.boundingBox(), detail.boundingBox()])
        expect(masterRect).not.toBeNull()
        expect(detailRect).not.toBeNull()
        const geometry = await page.evaluate(() => {
          const win = window as typeof window & { __nestedShiftValues?: Shift[]; __nestedObserverSupported?: boolean }
          return { shifts: win.__nestedShiftValues ?? [], supported: win.__nestedObserverSupported ?? false, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
        })
        const cls = clsSessionScore(geometry.shifts)
        const measurement = { viewport, fallbackRect, masterRect, detailRect, ...geometry, cls, horizontalDelta: Math.abs((detailRect?.x ?? 0) - (fallbackRect?.x ?? 0)) }
        await testInfo.attach(`nested-geometry-${viewport.width}.json`, { body: JSON.stringify(measurement, null, 2), contentType: 'application/json' })
        console.log('NESTED_CLS_MEASUREMENT', JSON.stringify({ viewport: viewport.width, cls, supported: geometry.supported, overflow: geometry.overflow, fallbackRect, masterRect, detailRect }))
        expect(geometry.supported, 'Chromium must support PerformanceObserver layout-shift entries').toBe(true)
        expect(geometry.overflow, 'horizontal overflow in the root document').toBeLessThanOrEqual(1)
        if (viewport.width >= 1024) {
          expect((detailRect?.x ?? 0)).toBeGreaterThan((masterRect?.x ?? 0) + (masterRect?.width ?? 0) - 2)
        } else {
          expect((detailRect?.y ?? 0)).toBeGreaterThanOrEqual((masterRect?.y ?? 0) + (masterRect?.height ?? 0) - 2)
        }
        expect(cls, 'nested route CLS target (controlled lab)').toBeLessThanOrEqual(0.01)
      } finally { release() }
    } finally { await context.close() }
  })
}
