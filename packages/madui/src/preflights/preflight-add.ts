import path from 'path'
import { addOptionsSchema } from '@/commands/add'
import { getConfig, type Config } from '@/utils/get-config'
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { Verbose } from '@/verbose/logger'
import * as ERRORS from '@/utils/errors'
import fs from 'fs-extra'
import { z } from 'zod'

export async function preFlightAdd(options: z.infer<typeof addOptionsSchema>)
  : Promise<{
    errors: Record<string, boolean>,
    config: Config | null
}> {
  /**
   * Here we checking if
   * - project exists
   * - package.json exists
   * - components.json exsits
   */
  const errors: Record<string, boolean> = {}
  
  Verbose('checking preflights checking...')
  Verbose('checking projects existence & package.json...')
  // Check if the path exists
  // and if project exist (by looking package.json)
  if(
    !fs.existsSync(options.cwd) ||
    !fs.existsSync(path.resolve(options.cwd, 'package.json'))
  ) {
    errors[ERRORS.MISSING_PROJECT_OR_EMPTY_PROJECT] = true
    return {
      errors,
      config: null,
    }
  }

  Verbose('checking components.json...')
  //checking for components.json
  if (!fs.existsSync(path.resolve(options.cwd, 'components.json'))) {
    errors[ERRORS.MISSING_COMPONENTS_CONFIG] = true
    return {
      errors,
      config: null,
    }
  }

  Verbose('getting config...')
  // get config
  try {
    const config = await getConfig(options.cwd)

    return {
      errors,
      config: config,
    }
  } catch (error) {
    logger.break()
    logger.error(`
      An invalid ${highlighter.info('components.json')} file was found at ${highlighter.info(options.cwd)}.
      \nRun ${highlighter.info('init')} command to initialize a new project with a valid ${highlighter.info('components.json')} file.
    `)
    logger.error(`
      Learn more at ${highlighter.info('https://madui.dev.vercel.app/docs/')}  
    `)
    logger.break()
    process.exit(1)
  }



  return { errors, config: null }
}