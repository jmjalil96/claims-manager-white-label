import type { PgBoss } from 'pg-boss'
import { registerEmailWorker } from '../features/email/index.js'
import { createLogger } from '../lib/logger.js'

const logger = createLogger('jobs')

export async function registerWorkers(boss: PgBoss): Promise<void> {
  logger.info('Registering job workers...')

  await registerEmailWorker(boss)

  logger.info('All job workers registered')
}

export { EMAIL_QUEUE_NAME, type EmailJobData } from '../features/email/index.js'
