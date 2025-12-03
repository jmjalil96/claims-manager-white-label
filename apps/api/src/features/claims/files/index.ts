/**
 * Claim files feature router
 * Aggregates all file-related routes for claims
 */

import { Router } from 'express'
import { getFilesUploadUrlRouter } from './getFilesUploadUrl/getFilesUploadUrl.route.js'
import { createFileRouter } from './createFile/createFile.route.js'
import { listFilesRouter } from './listFiles/listFiles.route.js'
import { deleteFileRouter } from './deleteFile/deleteFile.route.js'

const router = Router({ mergeParams: true })

// Mount file routes
router.use(getFilesUploadUrlRouter)
router.use(createFileRouter)
router.use(listFilesRouter)
router.use(deleteFileRouter)

export { router as filesRouter }
