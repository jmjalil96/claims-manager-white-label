/**
 * Storage utilities tests
 * Focus: Pure functions (no S3 calls needed)
 */

import { describe, it, expect } from 'vitest'
import {
  generateStorageKey,
  generateTempStorageKey,
  validateTempKeyOwnership,
  isAllowedMimeType,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from './storage.js'

// =============================================================================
// STORAGE KEY GENERATION
// =============================================================================

describe('Storage Utilities', () => {
  describe('generateStorageKey', () => {
    it('creates key with folder/entityId/uuid-filename format', () => {
      const key = generateStorageKey('claims', 'entity-123', 'document.pdf')

      expect(key).toMatch(/^claims\/entity-123\/[a-f0-9-]+-document\.pdf$/)
    })

    it('sanitizes special characters in filename', () => {
      const key = generateStorageKey('claims', 'entity-123', 'my file (1) [copy].pdf')

      expect(key).toMatch(/^claims\/entity-123\/[a-f0-9-]+-my_file__1___copy_\.pdf$/)
      expect(key).not.toContain(' ')
      expect(key).not.toContain('(')
      expect(key).not.toContain('[')
    })

    it('preserves valid characters', () => {
      const key = generateStorageKey('invoices', 'inv-456', 'file-name.2024.pdf')

      expect(key).toMatch(/file-name\.2024\.pdf$/)
    })

    it('generates unique keys for same inputs', () => {
      const key1 = generateStorageKey('claims', 'entity-123', 'file.pdf')
      const key2 = generateStorageKey('claims', 'entity-123', 'file.pdf')

      expect(key1).not.toBe(key2)
    })
  })

  describe('generateTempStorageKey', () => {
    it('creates key with folder/temp/userId/uuid-filename format', () => {
      const key = generateTempStorageKey('claims', 'user-123', 'upload.pdf')

      expect(key).toMatch(/^claims\/temp\/user-123\/[a-f0-9-]+-upload\.pdf$/)
    })

    it('sanitizes special characters in filename', () => {
      const key = generateTempStorageKey('claims', 'user-123', 'my document.pdf')

      expect(key).toMatch(/my_document\.pdf$/)
    })

    it('generates unique keys for same inputs', () => {
      const key1 = generateTempStorageKey('claims', 'user-123', 'file.pdf')
      const key2 = generateTempStorageKey('claims', 'user-123', 'file.pdf')

      expect(key1).not.toBe(key2)
    })
  })

  // =============================================================================
  // TEMP KEY VALIDATION
  // =============================================================================

  describe('validateTempKeyOwnership', () => {
    it('returns true for valid user temp key', () => {
      const key = 'claims/temp/user-123/abc-file.pdf'
      const result = validateTempKeyOwnership(key, 'claims', 'user-123')

      expect(result).toBe(true)
    })

    it('returns false for different user', () => {
      const key = 'claims/temp/user-123/abc-file.pdf'
      const result = validateTempKeyOwnership(key, 'claims', 'user-456')

      expect(result).toBe(false)
    })

    it('returns false for different folder', () => {
      const key = 'claims/temp/user-123/abc-file.pdf'
      const result = validateTempKeyOwnership(key, 'invoices', 'user-123')

      expect(result).toBe(false)
    })

    it('returns false for non-temp key', () => {
      const key = 'claims/entity-123/abc-file.pdf'
      const result = validateTempKeyOwnership(key, 'claims', 'user-123')

      expect(result).toBe(false)
    })

    it('returns false for malicious path traversal attempt', () => {
      const key = 'claims/temp/user-456/../user-123/abc-file.pdf'
      const result = validateTempKeyOwnership(key, 'claims', 'user-123')

      expect(result).toBe(false)
    })
  })

  // =============================================================================
  // MIME TYPE VALIDATION
  // =============================================================================

  describe('isAllowedMimeType', () => {
    it('allows PDF files', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true)
    })

    it('allows common image types', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true)
      expect(isAllowedMimeType('image/png')).toBe(true)
      expect(isAllowedMimeType('image/gif')).toBe(true)
      expect(isAllowedMimeType('image/webp')).toBe(true)
    })

    it('allows Excel files', () => {
      expect(isAllowedMimeType('application/vnd.ms-excel')).toBe(true)
      expect(
        isAllowedMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ).toBe(true)
    })

    it('allows Word documents', () => {
      expect(isAllowedMimeType('application/msword')).toBe(true)
      expect(
        isAllowedMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      ).toBe(true)
    })

    it('rejects dangerous file types', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false)
      expect(isAllowedMimeType('application/javascript')).toBe(false)
      expect(isAllowedMimeType('text/html')).toBe(false)
      expect(isAllowedMimeType('application/x-sh')).toBe(false)
    })

    it('rejects unknown mime types', () => {
      expect(isAllowedMimeType('application/unknown')).toBe(false)
      expect(isAllowedMimeType('fake/type')).toBe(false)
    })
  })

  // =============================================================================
  // CONSTANTS
  // =============================================================================

  describe('constants', () => {
    it('ALLOWED_MIME_TYPES contains expected types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf')
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg')
      expect(ALLOWED_MIME_TYPES.length).toBeGreaterThan(5)
    })

    it('MAX_FILE_SIZE is 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    })
  })
})
