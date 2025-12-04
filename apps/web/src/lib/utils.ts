import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format ISO date string (YYYY-MM-DD) to DD/MM/YYYY display format.
 * Timezone-safe: no Date parsing, just string manipulation.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return dateStr
  return `${match[3]}/${match[2]}/${match[1]}`
}
