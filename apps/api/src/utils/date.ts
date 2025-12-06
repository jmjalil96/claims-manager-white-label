/**
 * Date utility functions
 */

/**
 * Calculate business days between two dates (excluding weekends)
 * Start day is EXCLUSIVE (same day = 0 business days)
 *
 * @param startDate - Start date (exclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of business days between the dates
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  current.setDate(current.getDate() + 1) // Start from day AFTER startDate (exclusive)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}
