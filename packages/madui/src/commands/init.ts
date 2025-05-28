import path from 'path'
import { promises } from 'fs'
import isUrl from '@/utils/isUrl'
import { createProject, TEMPLATES } from '@/utils/create-project'
import * as ERRORS from '@/utils/errors'
import { BASE_COLORS, getRegistryItem } from '@/registry/api'
import { logger } from '@/utils/logger'
import { setVerbose } from '@/verbose/config'
import { highlighter } from '@/utils/highlighter'
import { handleError } from '@/utils/handle-error'
import { Verbose } from '@/verbose/logger'
import { Command } from 'commander'
import { z } from 'zod'
import { getProjectInfo } from '@/utils/get-project-info'
import { getConfig } from '@/utils/get-config'
import { preFlightInit } from '@/preflights/preflight-init'


export const initOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  cwd: z.string(),
  yes: z.boolean(),
  force: z.boolean(),
  defaults: z.boolean(),
  silent: z.boolean(),
  verbose: z.boolean(),
  isNewProject: z.boolean(),
  srcDir: z.boolean(),
  cssVariables: z.boolean(),
  style: z.string(),
  template: z.string().optional()
    .refine(
      (val)  => {
        if (val) {
          return TEMPLATES[val as keyof typeof TEMPLATES]
        }
        return true
      },
      {
        message: 'Invalid template name. Available templates: ' + Object.keys(TEMPLATES).join(', ')
      }
    ),
    baseColor: z.string().optional()
      .refine(
        (val) => {
          if (val) {
            return BASE_COLORS.find((clr) => clr.name === val)
          }
          return true
        },
        {
          message: 'Invalide base color. Available base colors: ' + BASE_COLORS.join(', ')
        }
    ),
})

export const init = new Command()
  .name('init')
  .description('Initialize a new madUI project')
  .argument(
    '[components...]',
    'components to add or url of the components'
  )
  .option(
    '-t, --template <template>',
    'the template to use. (next, next-monorepo)'
  )
  .option(
    '-b, --base-color <color>',
    "the base color to use. (neutral, gray, zinc, stone, slate)",
    undefined
  )
  .option('-y, --yes', 'Skip confirmatoin prompts', false)
  .option('-f, --force', 'Overwrite exisiting files', false)
  .option('-d, --defaults', 'Use default Configuration', false)
  .option('-c, --cwd <cwd>', 'add the working directory, default to current working directory', process.cwd)
  .option('-s, --silent', 'mute the output', false)
  .option('-v, --verbose', 'output the full working', false)
  .option(
    "--src-dir",
    "use the src directory when creating a new project.",
    false
  )
  .option(
    "--no-src-dir",
    "do not use the src directory when creating a new project."
  )
  .option("--css-variables", "use css variables for theming.", true)
  .option("--no-css-variables", "do not use css variables for theming.")
  .action(async (components: any, opts: any) => {
    try {
      const options = initOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        isNewProject: false,
        components,
        style: "index",
        ...opts,
      })

      setVerbose(options.verbose)

      if(components.length > 0 && isUrl(components[0])) {
        const item = await getRegistryItem(components[0], "", new Set(['type', 'extends']))

        if(item?.type === 'registry:style') {
          options.baseColor = 'neutral'
          options.style = item.extends ?? "index"
        }
      }

      await runInit(options)

      logger.success(`${highlighter.success('Success!')}\n Project initilized successfully \nNow be happy and forget about shadcn🙂`)
      logger.break()

    } catch (error) {
      logger.break()
      handleError(error)
    }
  })

async function runInit(
  options: z.infer<typeof initOptionsSchema> & {
    skipPreFlight?: boolean
  }) {
  
  let projectInfo
  let newProjectTemplate

  if(!options.skipPreFlight) {
    const preflight = await preFlightInit(options)
    
    if(preflight.errors[ERRORS.MISSING_PROJECT_OR_EMPTY_PROJECT]) {
      Verbose(`Project does not exist or is empty. Creating a new project...`)
      const { projectPath, template } = await createProject(options)
      if (!projectPath) {
        Verbose(`Failed to create new project.`)
        process.exit(1)
      }
      options.cwd = projectPath
      options.isNewProject = true
      newProjectTemplate = template
    }

    projectInfo = preflight.projectInfo
  } else {
    Verbose(`Skipping preflight checks...`)
    projectInfo = await getProjectInfo(options.cwd)
  }

  if (newProjectTemplate === 'next-monorepo') {
    options.cwd = path.resolve(options.cwd, 'apps/web')
    return await getConfig(options.cwd)
  }





  
  return null
}