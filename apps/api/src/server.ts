import { app } from './app.js'
import { logger } from './lib/logger.js'

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`)
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
