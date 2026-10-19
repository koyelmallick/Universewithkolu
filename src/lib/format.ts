/** Formatting helpers. Pure functions only - no React, no DOM. */

/** 1234.5 -> "1,235" */
export function formatInt(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/** 4.32e9 -> "4.3 billion" (human-scale for astronomy copy). */
export function formatBig(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)} trillion`
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)} billion`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} million`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} thousand`
  return formatInt(value)
}

/** "2026-04-06" -> "6 April 2026" without relying on the host locale. */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1] ?? month
  return `${Number(day)} ${monthName} ${year}`
}

/** Hostname of a URL, for compact source chips. Falls back to the raw value. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Two-digit zero pad. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Clamp helper used by scene components. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
