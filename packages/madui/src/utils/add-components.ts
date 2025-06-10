import {
  registryResolveItemsTree,
} from '@/registry/api'
import {
  getWorkspaceConfig,
  type Config
} from '@/utils/get-config';
import { getProjectTailwindVersionFromConfig } from '@/utils/get-project-info';
import { spinner } from '@/utils/spinner';
import path from 'path'

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

  const workspaceConfig = await getWorkspaceConfig(config)
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
  registrySpinner?.succeed(`Resolved ${tree.length} components from registry`)

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

  return null
}