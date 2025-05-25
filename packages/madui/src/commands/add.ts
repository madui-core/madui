import path from "path";
import isUrl from "@/utils/isUrl";
import { runInit }  from "@/commands/init";
import { getRegistryItem } from "@/registry/api"
import { registryItemTypeSchema } from "@/registry/schema"
import { getProjectInfo } from "@/utils/get-project-info"
// import { addComponents } from "@/utils/add-components"
import { preFlightAdd } from '@/preflights/preflight-add'
import { highlighter } from "@/utils/highlighter";
import { logger } from "@/utils/logger"
import { setVerbose } from "@/verbose/config";
import { Verbose } from "@/verbose/logger";
import { Command, option } from "commander";
import prompts from "prompts";
import { z } from "zod";

const LASTEST_VERSION_TAILWIND = process.env.LASTEST_VERSION_TAILWIND ?? "v4"

const DEPRECATED_COMPONENTS = {
  'v4': {
    'DP_toast01': {
      name: "toast",
      deprecatedBy: "sonner",
      message:
        "The toast component is deprecated. Use the sonner component instead.",
    },
    'DP_toaster01': {
      name: "toaster",
      deprecatedBy: "sonner",
      message:
        "The toaster component is deprecated. Use the sonner component instead.",
    },
  }
}

const createDeprecatedComponentsSet = (deprecatedComponents: Record<string, Record<string, {
  name: string;
  deprecatedBy: string;
  message: string;
}>>) => {
  type Component = {
    name: string;
    deprecatedBy: string;
    message: string;
  }

  const versionOrder = ['v4', 'v3'];
  const seenNames = new Map();

  return versionOrder
    .flatMap((version) =>
      deprecatedComponents[version]
        ? Object.entries(deprecatedComponents[version] as Record<string, Component>)
            .filter(([key, component]) => {
              if (seenNames.has(component.name)) {
                return false;
              }
              seenNames.set(component.name, true);
              return true;
            })
            .map(([key, component]) => ({
              ...component,
              version,
              key,
            }))
        : []
    );
};

/**
 * havent imoplemented
 * - Git
 * - noGit
 * - noInstall
 */
export const addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  force: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
  silent: z.boolean(),
  verbose: z.boolean(),
  srcDir: z.boolean(),
  cssVariables: z.boolean(),
  install: z.boolean(),
  git: z.boolean(),
  noInstall: z.boolean(),
  noGit: z.boolean()
})

export const add = new Command()
  .name("add")
  .description("add madui components to your project")
  .argument(
    "[components...]",
    "components to add or a url to a madui component")
  .option("-y, --yes", "skip configuraion prompts", false)
  .option("-o, --overwrite, -f, --force", "overwrite existing files", false)
  .option(
    "-c, --cwd <cwd>", 
    "the directory to add components to, default to current working directory",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add components to")
  .option("-s, --silent", "mute output", false)
  .option("-v, --verbose", "output the full error stack trace", false)
  .option("--src-dir", "use the source directory when creating new project.")
  .option("--no-src-dir", "do not use the source directory when creating new project.")
  .option("--css-variables", "use css varoables for theming", false)
  .option("--no-css-varibnles", "do not use css variables for theming", false)
  
  .option("--no-install", "do not install dependencies", false)
  .option("--no-git", "do not initialise a git repository", false)
  .action(async (components: any , opts: any) => {
    try {
      const options = addOptionsSchema.parse({
        components, 
        cwd: path.resolve(opts.cwd || process.cwd()), // where this return the cwd
        ...opts
      })

      setVerbose(options.verbose)

      let itemType: z.infer<typeof registryItemTypeSchema> | undefined = undefined 

      if(components.length > 0 && isUrl(components[0])) {
        const item = await getRegistryItem(components[0], "")
        itemType = item?.type
        Verbose(`Item type: ${itemType}`)
      }

      if (
        !options.yes &&
        (itemType === "registry:style" || itemType === "registry:theme")
      ) {

        logger.break()
        Verbose(`You are about to add a ${itemType} component. This may overwrite existing files.`)

        const { confirm } = await prompts({
          type: "confirm",
          name: "confirm",
          message: highlighter.info(
            `Adding new ${itemType.replace('registry:', "")} component. \nExisting CSS Variables and components will be overwritten. ${highlighter.warn('Continue?')}`,
          )
        })

        if (!confirm) {
          logger.break()
          logger.info("Installation cancelled.")
          logger.break()
          process.exit(1)
        }
      }

      // if (!options.components?.length) {
      //   options.components = await promptForRegistryComponents(options)
      // }
      
      /**
       * TODO: handle tailwind version missmatch
       * Posibly, by running install tailwind@latest
       */

      Verbose(`Getting project info`)
      const projectInfo = await getProjectInfo(options.cwd)

      Verbose(`Checking for DEPRECATED components`)
      if (projectInfo.tailwindVersion === 'v4') {
        const deprecatedComponents = createDeprecatedComponentsSet(DEPRECATED_COMPONENTS)
        if (deprecatedComponents?.length) {
          logger.break()
          deprecatedComponents.forEach((component) => {
            logger.warn(highlighter.warn(component.message))
          })
          logger.break()
          process.exit(1)
        }
      }

      let {errors, config} = await preFlightAdd(options)

      // no components.json file prompt the user to run init command
      if (errors.MISSING_COMPONENTS_CONFIG) {
        const { proceed } = await prompts({
          type: "confirm",
          name: "proceed",
          message: `You need to create a ${highlighter.info(
            "components.json"
          )} file to add components. Proceed?`,
          initial: true,
        })

        if (!proceed) {
          logger.break()
          process.exit(1)
        }
        
        config = await runInit({
          cwd: options.cwd,
          yes: true,
          force: true,
          defaults: false,
          skipPreflight: false,
          silent: true,
          isNewProject: false,
          srcDir: options.srcDir,
          cssVariables: options.cssVariables,
          style: "index",
        })

        let shouldUpdateAppIndex = false

        if (errors.MISSING_DIR_OR_EMPTY_PROJECT) {
          const { projectPath, template } = await createProject({
            cwd: options.cwd,
            force: options.force,
            srcDir: options.srcDir,
            components: options.components,
          })

          if(!projectPath) {
            logger.break()
            logger.error("Project path not found.")
            process.exit(1)
          }

          options.cwd = projectPath
          if (template === "next-monorepo") {
            options.cwd = path.resolve(options.cwd, "apps/web")
            config = await getConfig(options.cwd)
          }
          else {
            config = await runInit({
              cwd: options.cwd,
              yes: true,
              force: true,
              defaults: false,
              skipPreflight: true,
              silent: true,
              isNewProject: true,
              srcDir: options.srcDir,
              cssVariables: options.cssVariables,
              style: "index",
            })

            shouldUpdateAppIndex =
              options.components?.length === 1 &&
              !!options.components[0].match(/\/chat\/b\//)
            }
        }

        if (!config) {
        throw new Error(
          `Failed to read config at ${highlighter.info(options.cwd)}.`
          )
        }
      }

      /**
       * @Continue from here
       * 1 create Project
       * 2 add Components
       */
      



    } catch (error) {
      logger.error("Error parsing options:", error)
    }
  })
  
  
