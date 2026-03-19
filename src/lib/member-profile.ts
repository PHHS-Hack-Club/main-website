function normalizeOptionalText(value: unknown, maxLength: number) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null
  return text.slice(0, maxLength)
}

export function normalizeHeadline(value: unknown) {
  return normalizeOptionalText(value, 80)
}

export function normalizeBio(value: unknown) {
  return normalizeOptionalText(value, 600)
}

export function normalizeExternalUrl(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}
