import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { z } from 'zod'

export function handleError(error: unknown) {
  logger.error(
    'Something boke, please check the error below for details.'
  )
  logger.error('if you think this is a bug, please open an issue on GitHub (here https://github.com/Anas-github-acc/madui/issues/new).')
  logger.break()

  if( typeof error === 'string') {
    logger.error(error)
  }
  else if (error instanceof z.ZodError) {
    logger.error('Validation error:')
    for (const [key, value] of Object.entries(error.flatten().fieldErrors)) {
      logger.error(`- ${highlighter.info(key)}: ${value}`)
    }
  }
  else if( error instanceof Error) {
    logger.error(error.message)
  }

  logger.break()
  process.exit(1)
}
