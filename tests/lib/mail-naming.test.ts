import { describe, it, expect } from 'vitest'
import { parseName, generateCandidates, isValidLocalPart } from '@/lib/mail-naming'

describe('parseName', () => {
  it('handles simple names', () => {
    expect(parseName('Alex Radu')).toEqual({ first: 'alex', last: 'radu' })
  })
  it('lowercases', () => {
    expect(parseName('ADA LOVELACE')).toEqual({ first: 'ada', last: 'lovelace' })
  })
  it('strips diacritics', () => {
    expect(parseName('María Ñuñez')).toEqual({ first: 'maria', last: 'nunez' })
  })
  it('strips apostrophes from parts', () => {
    expect(parseName("María O'Connor")).toEqual({ first: 'maria', last: 'oconnor' })
  })
  it('strips hyphens from parts', () => {
    expect(parseName('Jean-Luc Picard')).toEqual({ first: 'jeanluc', last: 'picard' })
  })
  it('drops Jr/Sr/Roman suffixes', () => {
    expect(parseName('Alexander Hamilton Jr.')).toEqual({ first: 'alexander', last: 'hamilton' })
    expect(parseName('John Smith III')).toEqual({ first: 'john', last: 'smith' })
  })
  it('handles single name by returning null', () => {
    expect(parseName('Madonna')).toBeNull()
  })
  it('handles empty by returning null', () => {
    expect(parseName('')).toBeNull()
    expect(parseName('   ')).toBeNull()
  })
  it('picks first and last when middle name present', () => {
    expect(parseName('Mary Jane Watson')).toEqual({ first: 'mary', last: 'watson' })
  })
})

describe('generateCandidates', () => {
  it('generates Alex Radu with firstlast first (pre-selected)', () => {
    const cands = generateCandidates('Alex Radu').map((c) => c.localPart)
    expect(cands[0]).toBe('alexradu')
    expect(cands).toEqual(['alexradu', 'alex.radu', 'alex', 'aradu', 'alexr', 'alex.r'])
  })

  it('generates Ada Lovelace', () => {
    expect(generateCandidates('Ada Lovelace').map((c) => c.localPart)).toEqual([
      'adalovelace', 'ada.lovelace', 'ada', 'alovelace', 'adal', 'ada.l',
    ])
  })

  it('omits first-only and firstlastInitial/first.lastInitial for short first (Li Wei)', () => {
    const cands = generateCandidates('Li Wei').map((c) => c.localPart)
    expect(cands).toEqual(['liwei', 'li.wei', 'lwei'])
    expect(cands).not.toContain('li')
  })

  it('handles Jean-Luc Picard (hyphen stripped → jeanluc)', () => {
    expect(generateCandidates('Jean-Luc Picard').map((c) => c.localPart)).toEqual([
      'jeanlucpicard', 'jeanluc.picard', 'jeanluc', 'jpicard', 'jeanlucp', 'jeanluc.p',
    ])
  })

  it('handles Alexander Hamilton Jr.', () => {
    expect(generateCandidates('Alexander Hamilton Jr.').map((c) => c.localPart)).toEqual([
      'alexanderhamilton', 'alexander.hamilton', 'alexander', 'ahamilton', 'alexanderh', 'alexander.h',
    ])
  })

  it('returns empty for unparseable name', () => {
    expect(generateCandidates('Madonna')).toEqual([])
    expect(generateCandidates('')).toEqual([])
  })

  it('first candidate carries format "firstlast"', () => {
    expect(generateCandidates('Alex Radu')[0].format).toBe('firstlast')
  })
})

describe('isValidLocalPart', () => {
  it('accepts well-formed parts', () => {
    expect(isValidLocalPart('alexradu')).toBe(true)
    expect(isValidLocalPart('alex.radu')).toBe(true)
    expect(isValidLocalPart('alex-radu')).toBe(true)
    expect(isValidLocalPart('ada')).toBe(true)
  })
  it('rejects too-short parts (< 3 chars)', () => {
    expect(isValidLocalPart('ab')).toBe(false)
  })
  it('rejects too-long parts (> 32 chars)', () => {
    expect(isValidLocalPart('a'.repeat(33))).toBe(false)
  })
  it('rejects leading digit', () => {
    expect(isValidLocalPart('1alex')).toBe(false)
  })
  it('rejects leading dot or hyphen', () => {
    expect(isValidLocalPart('.alex')).toBe(false)
    expect(isValidLocalPart('-alex')).toBe(false)
  })
  it('rejects trailing dot or hyphen', () => {
    expect(isValidLocalPart('alex.')).toBe(false)
    expect(isValidLocalPart('alex-')).toBe(false)
  })
  it('rejects consecutive dots', () => {
    expect(isValidLocalPart('alex..radu')).toBe(false)
  })
  it('rejects uppercase', () => {
    expect(isValidLocalPart('Alex')).toBe(false)
  })
  it('rejects special chars', () => {
    expect(isValidLocalPart('alex@radu')).toBe(false)
    expect(isValidLocalPart('alex+radu')).toBe(false)
    expect(isValidLocalPart('alex_radu')).toBe(false)
  })
})
