export interface NameParts {
  first: string
  last: string
}

export type CandidateFormat =
  | 'firstlast'
  | 'first.last'
  | 'first'
  | 'firstInitiallast'
  | 'firstlastInitial'
  | 'first.lastInitial'

export interface Candidate {
  localPart: string
  format: CandidateFormat
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v'])

function normalize(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 '\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripPartSymbols(part: string): string {
  return part.replace(/['\-]/g, '')
}

export function parseName(fullName: string): NameParts | null {
  if (!fullName) return null
  const normalized = normalize(fullName)
  if (!normalized) return null

  let tokens = normalized.split(' ').filter(Boolean)
  tokens = tokens.filter((t) => !SUFFIXES.has(stripPartSymbols(t)))

  if (tokens.length < 2) return null

  const first = stripPartSymbols(tokens[0])
  const last = stripPartSymbols(tokens[tokens.length - 1])

  if (!first || !last) return null
  return { first, last }
}

export function generateCandidates(fullName: string): Candidate[] {
  const parts = parseName(fullName)
  if (!parts) return []
  const { first, last } = parts
  const fi = first[0]
  const li = last[0]

  const candidates: Candidate[] = []
  candidates.push({ localPart: `${first}${last}`, format: 'firstlast' })
  candidates.push({ localPart: `${first}.${last}`, format: 'first.last' })
  if (first.length >= 3) {
    candidates.push({ localPart: first, format: 'first' })
  }
  candidates.push({ localPart: `${fi}${last}`, format: 'firstInitiallast' })
  if (first.length >= 3) {
    candidates.push({ localPart: `${first}${li}`, format: 'firstlastInitial' })
    candidates.push({ localPart: `${first}.${li}`, format: 'first.lastInitial' })
  }

  return candidates.filter((c) => isValidLocalPart(c.localPart))
}

const LOCAL_PART_RE = /^[a-z][a-z0-9.\-]{2,31}$/

export function isValidLocalPart(localPart: string): boolean {
  if (!LOCAL_PART_RE.test(localPart)) return false
  if (localPart.includes('..')) return false
  if (localPart.endsWith('.') || localPart.endsWith('-')) return false
  return true
}
