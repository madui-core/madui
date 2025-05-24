import { isVerbose } from './config'
import { logger } from '@/utils/logger'

export const Verbose = (...args: string[]) => {
  if (isVerbose()) {
    logger.verbose(`VERBOSE: ${args.join(' ')}`)
  }
}