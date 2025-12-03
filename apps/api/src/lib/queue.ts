import { PgBoss } from 'pg-boss'
import { createLogger } from './logger.js'

const logger = createLogger('queue')

let boss: PgBoss | null = null

export function getQueue(): PgBoss {
  if (boss) return boss

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for queue')
  }

  boss = new PgBoss({
    connectionString,
    schema: 'pgboss',
  })

  boss.on('error', (error: Error) => {
    logger.error(error, 'pg-boss error')
  })

  return boss
}

export async function startQueue(): Promise<PgBoss> {
  const queue = getQueue()
  await queue.start()
  logger.info('Queue started')
  return queue
}

export async function stopQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 })
    logger.info('Queue stopped')
    boss = null
  }
}

export { PgBoss }
