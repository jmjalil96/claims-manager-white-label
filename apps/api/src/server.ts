import { app } from './app.js'
import { logger } from './lib/logger.js'
import { startQueue, stopQueue } from './lib/queue.js'
import { registerWorkers } from './jobs/index.js'

const PORT = process.env.PORT || 3001

async function start() {
  // Start the job queue and register workers
  const boss = await startQueue()
  await registerWorkers(boss)

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`)
  })

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`)

    // Stop accepting new connections
    server.close(() => {
      // Stop the queue gracefully (waits for running jobs)
      stopQueue()
        .then(() => {
          logger.info('Server closed')
          process.exit(0)
        })
        .catch((err: unknown) => {
          logger.error(err, 'Error during shutdown')
          process.exit(1)
        })
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch((error: unknown) => {
  logger.error(error, 'Failed to start server')
  process.exit(1)
})
