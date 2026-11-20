import { describe, expect, it } from 'vitest'
import { getPersonById, people, searchPeople } from '../../src/data/people'

const expectedIds = [
  'ada-lovelace',
  'alan-turing',
  'grace-hopper',
  'margaret-hamilton',
  'donald-knuth',
  'radia-perlman',
]

describe('people fixture', () => {
  it('provides the six pioneers with unique stable slugs', () => {
    const ids = people.map(({ id }) => id)

    expect(ids).toHaveLength(6)
    expect(new Set(ids)).toEqual(new Set(expectedIds))
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(?:-[a-z]+)+$/)
    }
  })

  it('includes concise summaries and non-empty profile details', () => {
    for (const { name, era, field, summary, contributions } of people) {
      expect(name.trim()).not.toBe('')
      expect(era.trim()).not.toBe('')
      expect(field.trim()).not.toBe('')
      expect(summary.trim()).not.toBe('')
      expect(summary.length).toBeLessThanOrEqual(200)
      expect(contributions.length).toBeGreaterThan(0)
      expect(contributions.every((contribution) => contribution.trim() !== '')).toBe(true)
    }
  })

  it('freezes the collection, records, and contribution lists', () => {
    expect(Object.isFrozen(people)).toBe(true)
    for (const person of people) {
      expect(Object.isFrozen(person)).toBe(true)
      expect(Object.isFrozen(person.contributions)).toBe(true)
    }
  })
})

describe('getPersonById', () => {
  it('returns the original record for an exact slug', () => {
    for (const person of people) {
      expect(getPersonById(person.id)).toBe(person)
    }
  })

  it.each(['unknown-person', 'Ada-Lovelace', ' ada-lovelace ', ''])(
    'returns undefined for the non-matching ID %j',
    (id) => {
      expect(getPersonById(id)).toBeUndefined()
    },
  )
})

describe('searchPeople', () => {
  it.each(['', '  \t '])('returns all six for the blank query %j', (query) => {
    expect(searchPeople(query)).toEqual(people)
  })

  it('matches partial names regardless of case and surrounding whitespace', () => {
    expect(searchPeople('  gRaCe  ').map(({ name }) => name)).toEqual(['Grace Hopper'])
    expect(searchPeople('LoVeLaCe').map(({ name }) => name)).toEqual(['Ada Lovelace'])
  })

  it('finds multiple matches in fixture order without changing the fixture', () => {
    const originalIds = people.map(({ id }) => id)
    const matches = searchPeople('rA')

    expect(matches.map(({ id }) => id)).toEqual(['grace-hopper', 'radia-perlman'])
    expect(people.map(({ id }) => id)).toEqual(originalIds)
  })

  it('returns no results for an unmatched name or slug-only query', () => {
    expect(searchPeople('nonexistent')).toEqual([])
    expect(searchPeople('grace-hopper')).toEqual([])
  })
})
