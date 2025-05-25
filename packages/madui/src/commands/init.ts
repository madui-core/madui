import path from 'path'
import { promises } from 'fs'
import { TEMPLATES } from '@/utils/create-project'
import { BASE_COLORS } from '@/registry/api'
import { logger } from '@/utils/logger'
import { Command } from 'commander'
import { z } from 'zod'


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
  .option('-v', '--verbose', 'output the full working', false)
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
  .action(async (components, opts) => {
    try {
      const options = initOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        isNewProject: false,
        components,
        style: "index",
        ...opts,
      })


    } catch (error) {
      logger.break()
      logger.error(`Failed to initialize project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      if (opts.verbose) {
        logger.error(error instanceof Error ? error.stack : 'No stack trace available')
      }
      process.exit(1)
    }
  })