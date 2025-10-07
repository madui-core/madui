import path from 'path'
import fs from 'fs'
import isUrl from '@/utils/isUrl'
import { getProjectConfig, getProjectInfo, getProjectTailwindVersionFromConfig } from '@/utils/get-project-info'
import { createProject, TEMPLATES } from '@/utils/create-project'
import {
  type Config,
  DEFAULT_COMPONENTS,
  DEFAULT_TAILWIND_CONFIG,
  DEFAULT_TAILWIND_CSS,
  DEFAULT_UTILS,
  getConfig,
  rawConfigSchema,
  resolveConfigPaths
} from '@/utils/get-config'
import { addComponents } from '@/utils/add-components'
import { updateTailwindContent } from '@/utils/updaters/update-tailwind-content'
import { preFlightInit } from '@/preflights/preflight-init'
import { BASE_COLORS, getRegistryBaseColors, getRegistryItem, getRegistryStyles } from '@/registry/api'
import * as ERRORS from '@/utils/errors'
import { logger } from '@/utils/logger'
import { setVerbose } from '@/verbose/config'
import { highlighter } from '@/utils/highlighter'
import { handleError } from '@/utils/handle-error'
import { Verbose } from '@/verbose/logger'
import { spinner } from '@/utils/spinner'
import { Command } from 'commander'
import { z } from 'zod'
import prompts from 'prompts'

const LIVE_HOST = process.env.MADUI_HOST || "http://localhost:3001"

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
  .option('-c, --cwd <cwd>',
    'add the working directory, default to current working directory',
    process.cwd()
  )
  .option('-s, --silent', 'mute the output', false)
  .option('-V, --verbose', 'output the full working', false)
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
        isNewProject: false,
        style: "index",
        ...opts,  /** @fixed Place this before setting cwd to ensure the resolved cwd don't get overridden. */
        cwd: path.resolve(opts.cwd),
        components,
      })

      console.log(path.resolve(options.cwd))

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

export async function runInit(
  options: z.infer<typeof initOptionsSchema> & {
    skipPreFlight?: boolean
  }) {
  
  let projectInfo
  let newProjectTemplate

  if(!options.skipPreFlight) {
    const preflight = await preFlightInit(options)
    
    if(preflight.errors[ERRORS.MISSING_PROJECT_OR_EMPTY_PROJECT]) {
      Verbose(`Project does not exist or is empty. Creating a new project...`)
      const { projectName, projectPath, template } = await createProject(options)
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

  // if (newProjectTemplate === 'next-monorepo') {
  //   options.cwd = path.resolve(options.cwd, 'apps/web')
  //   return await getConfig(options.cwd)
  // }


  const componentsConfig = await getProjectConfig(options.cwd, projectInfo)
  const config = componentsConfig ?
    await promptsForMinimalConfig(componentsConfig, options) :
    await promptsForConfig(await getConfig(options.cwd))

  if(!options.yes) {
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Writing Config to ${highlighter.info('components.json')}. Continue?`,
      initial: true,
    })
    if(!confirm) {
      process.exit(0)
    }
  }

  // Writing Components.json
  const componentsSpinner = spinner(`creating ${highlighter.info('components.json')}...`).start()
  fs.writeFileSync(path.resolve(options.cwd, "components.json"), JSON.stringify(config, null, 2), "utf-8")
  componentsSpinner.succeed(`Created ${highlighter.info('components.json')} at ${highlighter.info(options.cwd)}`)

  //adding components
  const fullConfig = await resolveConfigPaths(config, options.cwd)
  Verbose(`Resolved Config Paths`)
  const components = [
    ...(options.style === "none" ? [] : [options.style]),
    ...(options.components ?? []),
  ]

  await addComponents(
    components,
    fullConfig,
    {
      overwrite: true,
      silent: options.silent,
      style: options.style,
      isNewProject: options.isNewProject || projectInfo?.framework.name === 'next-app',
    })

  Verbose("Added components")

  // If a new project is using src dir, let's update the tailwind content config.
  // TODO: Handle this per framework.
  if (options.isNewProject && options.srcDir) {
    await updateTailwindContent(
      ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
      fullConfig,
      {
        silent: options.silent,
      }
    )
  }
  
  return fullConfig
}

export async function promptsForConfig(componenetsConfig: Config | null = null) {
  const [styles, baseColor] = await Promise.all([
    getRegistryStyles(),
    getRegistryBaseColors()
  ])

  console.log(componenetsConfig)

  const options = await prompts([
    {
      type: 'toggle',
      name: 'typescript',
      message: `Would you like to use ${highlighter.info(
        "TypeScript"
      )} (recommended)?`,
      initial: componenetsConfig?.tsx ?? true,
      active: 'yes',
      inactive: 'no',
    },
    {
      type: 'select',
      name: 'style',
      message: `Which ${highlighter.info('style')} do you want to use?`,
      choices: Array.isArray(styles) ? styles.map((style) => ({
        title: style.name === 'new-york' ? 'New-York (recommended)' : style.label,
        value: style.name,
      })) : [],
      initial: 0,
    },
    {
      type: 'select',
      name: 'tailwindBaseColor',
      message: `Which ${highlighter.info('base color')} do you want to use?`,
      choices: baseColor.map((color) => ({
        title: color.label, 
        value: color.name,
      })),
      initial: 0
    },
    {
      type: "text",
      name: "tailwindCss",
      message: `Where is your ${highlighter.info("global CSS")} file?`,
      initial: componenetsConfig?.tailwind.css ?? DEFAULT_TAILWIND_CSS,
    },
    {
      type: 'toggle',
      name: 'tailwindCssVariables',
      message: `Would you like to use ${highlighter.info("CSS variables")} for theming?`,
      initial: true,
      active: 'yes',
      inactive: "no",  
    },
    {
      type: 'text',
      name: 'tailwindPrefix',
      message: `Do you want to use a custom ${highlighter.info('tailwnind prefix eg., tw-')}? (leave empty for default)`,
      initial: "",
      validate: (value) => {
        if (value && !/^[a-zA-Z0-9-]+$/.test(value)) {
          return 'Prefix can only contain alphanumeric characters and hyphens.'
        }
        return true
      },
    },
    {
      type: "text",
      name: "tailwindConfig",
      message: `Write the custom path to your ${highlighter.info('tailwind.config.js')} file.`,
      initial: componenetsConfig?.tailwind.config ?? DEFAULT_TAILWIND_CONFIG,
    },
    {
      type: 'text',
      name: 'components',
      message:`Configure the import alias for ${highlighter.info('components')}:`,
      initial: componenetsConfig?.aliases["components"] ?? DEFAULT_COMPONENTS,
    },
    {
      type: 'text',
      name: 'utils',
      message: `Configure the import alias for ${highlighter.info('utils')}:`,
      initial: componenetsConfig?.aliases["utils"] ?? DEFAULT_UTILS,
    },
    {
      type: 'toggle',
      name: 'rsc',
      message: `Would you like to use ${highlighter.info("React Server Components")} (RSC)?`,
      initial: componenetsConfig?.rsc ?? true,
      active: 'yes',
      inactive: 'no',
    }
  ])

  return rawConfigSchema.parse({
    $schema: "https://ui.shadcn.com/schema.json",
    style: options.style,
    tailwind: {
      config: options.tailwindConfig,
      css: options.tailwindCss,
      baseColor: options.tailwindBaseColor,
      cssVariables: options.tailwindCssVariables,
      prefix: options.tailwindPrefix,
    },
    rsc: options.rsc,
    tsx: options.typescript,
    aliases: {
      utils: options.utils,
      components: options.components,
      // TODO: fix this.
      lib: options.components.replace(/\/components$/, "lib"),
      hooks: options.components.replace(/\/components$/, "hooks"),
    },
  })
}


export async function promptsForMinimalConfig(
  componentsConfig: Config,
  options: z.infer<typeof initOptionsSchema>
) {
  let style = componentsConfig.style
  let baseColor = options.baseColor
  let cssVariables = componentsConfig.tailwind.cssVariables

  if (!options.defaults) {
    const [styles, baseColors, tailwindVersion] = await Promise.all([
      getRegistryStyles(),
      getRegistryBaseColors(),
      getProjectTailwindVersionFromConfig(componentsConfig)
    ])

    const prompt = await prompts([
      {
        type: tailwindVersion === 'v4' ? null : 'select',
        name: 'style',
        message: `which ${highlighter.info('style')} do you want to use?`,
        choices: Array.isArray(styles) ? styles.map((style) => ({
          title: style.name === 'new-york' ? 'New-York (recommended)' : style.label,
          value: style.name,
        })) : [],
        initial: 0,
      },
      {
        type: options.baseColor ? 'select' : null,
        name: 'tailwindBaseColor',
        message: `which ${highlighter.info('base color')} do you want to use?`,
        choices: baseColors.map((color) => ({
          title: color.label,
          value: color.name,
        })),
        initial: 0,
      },
    ])
    

    style = prompt.style ?? style
    baseColor = prompt.tailwindBaseColor ?? baseColor
    cssVariables = options.cssVariables
  }

  return rawConfigSchema.parse({
    $schema: componentsConfig.$schema,
    style,
    tailwind: {
      ...componentsConfig?.tailwind,
      baseColor,
      cssVariables,
    },
    rsc: componentsConfig?.rsc,
    tsx: componentsConfig?.tsx,
    aliases: componentsConfig?.aliases,
    iconLibrary: componentsConfig?.iconLibrary,
  })
}