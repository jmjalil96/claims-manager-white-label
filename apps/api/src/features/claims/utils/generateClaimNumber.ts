/**
 * Claim number generation using database sequence + hashids encoding
 * Generates human-readable, collision-free claim identifiers
 */

import Hashids from 'hashids'
import { env } from '../../../config/env.js'

/** Minimum length for encoded claim numbers */
const HASHIDS_MIN_LENGTH = 8

/** Alphabet without ambiguous characters (no 0/O, 1/I/L) */
const HASHIDS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Default salt for development (should be overridden in production) */
const DEFAULT_SALT = 'claims-manager-dev-fallback'

const hashids = new Hashids(
  env.CLAIM_NUMBER_SALT || DEFAULT_SALT,
  HASHIDS_MIN_LENGTH,
  HASHIDS_ALPHABET
)

/**
 * Generate a claim number from a database sequence ID
 *
 * @param sequenceId - Auto-increment ID from database (claimSequence)
 * @returns Formatted claim number string (e.g., "RECL_A7K2M9P4")
 *
 * @example
 * const claimNumber = generateClaimNumber(12345)
 * // Returns: "RECL_A7K2M9P4"
 */
export function generateClaimNumber(sequenceId: number): string {
  const encoded = hashids.encode(sequenceId)
  return `RECL_${encoded.toUpperCase()}`
}
