import path from 'path';
import { initOptionsSchema } from '@/commands/init';
import * as ERRORS from '@/utils/errors';
import { getProjectInfo } from '@/utils/get-project-info';
import { highlighter } from '@/utils/highlighter';
import { logger } from '@/utils/logger';
import { spinner } from '@/utils/spinner';

import fs from 'fs-extra';
import { z } from 'zod';
import { Verbose } from '@/verbose/logger';


const isTailwindConfigured = (
  tailwindVersion: string | null | undefined,
  tailwindConfigFile: unknown,
  tailwindCssFile: unknown
) => {
  
  if (!tailwindVersion) return false
  
  if (tailwindVersion === "v3") {
    return tailwindConfigFile && tailwindCssFile
  }
  
  if (tailwindVersion === "v4") {
    return !!tailwindCssFile
  }
  
  return true
}

export async function preFlightInit(options: z.infer<typeof initOptionsSchema>) {
  const errors: Record<string, boolean> = {}

  Verbose('checking projects existence & package.json...')
  // Ensure target directory exists.
  // Check for empty project. We assume if no package.json exists, the project is empty.
  if (
    !fs.existsSync(options.cwd) ||
    !fs.existsSync(path.resolve(options.cwd, "package.json"))
  ) {
    errors[ERRORS.MISSING_PROJECT_OR_EMPTY_PROJECT] = true
    return {
      errors,
      projectInfo: null,
    }
  }

  
  // checking for components.json
  const projectSpinner = spinner('preflight checking...',{
    silent: options.silent
  }).start()


  Verbose('checking components.json...')
  if (
    fs.existsSync(path.resolve(options.cwd, 'components.json')) &&
    !options.force
  ) {
    projectSpinner.fail(
      `See around ${highlighter.info('components.json')} file already exists at ${highlighter.info(options.cwd)}.`
    )
    logger.break()
    logger.error(
      `To start over, remove the ${highlighter.info('components.json')} file and run ${highlighter.info('init')} again or use ${highlighter.info('--force')}.`
    )
    process.exit(1)
  }

  // Verfiying framework
  projectSpinner.succeed(
    `Preflight checks passed at ${highlighter.info(options.cwd)}`
  )

  const frameworkSpinner = spinner(`Verifying framework.`, {
    silent: options.silent,
  }).start()
  
  Verbose('getting project info...')
  const projectInfo = await getProjectInfo(options.cwd)
  if(!projectInfo || projectInfo.framework.name === 'manual') {
    errors[ERRORS.MISSING_FRAMEWORK] = true
    frameworkSpinner.fail(
      `No supported framework found!`
    )
    logger.break()
    if (projectInfo?.framework.links.installation) {
      logger.error(
        `Visit ${highlighter.info(projectInfo.framework.links.installation)}} to manually config.\n Once you are done with config run ${highlighter.info('madui add <components..>')}.`
      )
      logger.break()
      process.exit(1)
    }
    frameworkSpinner?.succeed(
      `Verifying framework. Found ${highlighter.info(
        projectInfo.framework.label
      )}.`
    )

    // Checking tailwind css
    let tailwindMsg = 'Validating Tailwind css...'

    if (projectInfo.tailwindVersion === 'v4') {
      tailwindMsg = `Validating Tailwind Config. Found ${highlighter.info('v4')}.`
    }

    const tailwindSpinner = spinner(tailwindMsg, {
      silent: options.silent
    }).start()

    const { tailwindVersion, tailwindConfigFile, tailwindCssFile } = projectInfo

    if (isTailwindConfigured(tailwindVersion, tailwindConfigFile, tailwindCssFile)) {
      tailwindSpinner?.succeed(`Found Tailwind Config at ${highlighter.info(tailwindConfigFile as string)}.`)
    } else {
      errors[ERRORS.MISSING_TAILWIND_CONFIG] = true
      tailwindSpinner?.fail()
    }


    // checking alias in tsconfig
    const tsConfigSpinner = spinner(`Validating import alias.`, {
      silent: options.silent,
    }).start()

    if(!projectInfo.aliasPrefix) {
      errors[ERRORS.IMPORT_ALIAS_MISSING] = true
      tsConfigSpinner.fail()
    } else {
      tsConfigSpinner.succeed(`Found import alias ${highlighter.info(projectInfo.aliasPrefix)}.`)
    }

    if (Object.keys(errors).length > 0) {
      if (errors[ERRORS.MISSING_TAILWIND_CONFIG]) {
        logger.break()
        logger.error(
          `No Tailwind config found at ${highlighter.info(
            options.cwd
          )}.`
        )
        logger.error(
          `It is likely you do not have Tailwind CSS installed or have an invalid configuration.`
        )
        logger.error(`Install Tailwind CSS then try again.`)
        if (projectInfo?.framework.links.tailwind) {
          logger.error(
            `Visit ${highlighter.info(
              projectInfo?.framework.links.tailwind
            )} to get started.`
          )
        }
      }

      if (errors[ERRORS.IMPORT_ALIAS_MISSING]) {
        logger.break()
        logger.error(`No import alias found in tsconfig.json file.`)
        if (projectInfo?.framework.links.installation) {
          logger.error(
            `Visit ${highlighter.info(
              projectInfo?.framework.links.installation
            )} to learn how to set an import alias.`
          )
        }
      }

      logger.break()
      process.exit(1)
    }  
  }

  return {
    errors,
    projectInfo,
  }

  
}
