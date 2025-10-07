import path from "path"
import {
  fetchRegistry,
  getRegistryParentMap,
  getRegistryTypeAliasMap,
  registryResolveItemsTree,
  resolveRegistryItems,
} from "@/registry/api"
import { registryItemSchema } from "@/registry/schema"
import {
  configSchema,
  findCommonRoot,
  findPackageRoot,
  getWorkspaceConfig,
  workspaceConfigSchema,
  type Config,
} from "@/utils/get-config"
import { getProjectTailwindVersionFromConfig } from "@/utils/get-project-info"
import { handleError } from "@/utils/handle-error"
import { logger } from "@/utils/logger"
import { spinner } from "@/utils/spinner"
import { updateCss } from "@/utils/updaters/update-css"
import { updateCssVars } from "@/utils/updaters/update-css-vars"
import { updateDependencies } from "@/utils/updaters/update-dependencies"
import { updateFiles } from "@/utils/updaters/update-files"
import { updateTailwindConfig } from "@/utils/updaters/update-tailwind-config"
import { z } from "zod"

export async function addComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean
    silent?: boolean
    style?: string
    isNewProject?: boolean
  } 
) {
  options = {
    overwrite: false,
    silent: false,
    isNewProject: false,
    style: 'index',
    ...options,
  }

  // const workspaceConfig = await getWorkspaceConfig(config)
  // if (
  //   workspaceConfig &&
  //   workspaceConfig.ui &&
  //   workspaceConfig.ui.resolvedPaths.cwd !== config.resolvedPaths.cwd
  // ) {
  //   return await addWorkSpaceComponents(components, config, workspaceConfig,{
  //       ...options,
  //       isRemote: components.length === 1 && components[0].match(/\/chat\/b\//),
  //   })
  // }

  return addProjectComponents(components, config, options)
}

export async function addProjectComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean
    silent?: boolean
    isNewProject?: boolean
    style?: string
  }
) {
  const registrySpinner = spinner(`Checking registry for components...`, {
    silent: options.silent,
  })?.start()

  const tree = await registryResolveItemsTree(components, config)

  if (!tree) {
    registrySpinner?.fail('Failed to resolve components from registry')
    process.exit(1)
  }
  registrySpinner?.succeed(`Resolved components from registry`)

  const tailwindVersion = await getProjectTailwindVersionFromConfig(config)
  await updateTailwindConfig(tree.tailwind?.config, config,{
    silent: options.silent,
    tailwindVersion,
  })
  
  /**
   * @overwrite css variables
   * @add css
   * @update dependencies
   * @update files
   */

  const overwriteCssVars = await shouldOverwriteCssVars(components, config)
  await updateCssVars(tree.cssVars, config, {
    cleanupDefaultNextStyles: options.isNewProject,
    silent: options.silent,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config,
    overwriteCssVars,
    initIndex: options.style ? options.style === "index" : false,
  })

  // Add CSS updater
  await updateCss(tree.css, config, {
    silent: options.silent,
  })

  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent,
  })
  await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
  })

  if (tree.docs) {
    logger.info(tree.docs)
  }
}

async function shouldOverwriteCssVars(
  components: z.infer<typeof registryItemSchema>["name"][],
  config: z.infer<typeof configSchema>
) {
  let registryItems = await resolveRegistryItems(components, config)
  let result = await fetchRegistry(registryItems)
  const payload = z.array(registryItemSchema).parse(result)

  return payload.some(
    (component) =>
      component.type === "registry:theme" || component.type === "registry:style"
  )
}