/**
 * 
 * This is components.json config
 * 
 */

import path from 'path'
import { getProjectInfo } from "@/utils/get-project-info"
import { highlighter } from '@/utils/highlighter'
import { resolveImport } from "@/utils/resolve-import"
import fg from 'fast-glob'
import { loadConfig } from "tsconfig-paths"
import { cosmiconfig } from "cosmiconfig"
import { z } from "zod"

export const DEFAULT_STYLE = "default"
export const DEFAULT_COMPONENTS = "@/components"
export const DEFAULT_UTILS = "@/lib/utils"
export const DEFAULT_TAILWIND_CSS = "app/globals.css"
export const DEFAULT_TAILWIND_CONFIG = "tailwind.config.js"
export const DEFAULT_TAILWIND_BASE_COLOR = "slate"

const explorer = cosmiconfig("components", {
  searchPlaces: ["components.json"],
})

export const rawConfigSchema = z.object({
  $schema: z.string().optional(),
  style: z.string(),
  rsc: z.coerce.boolean().default(false),
  tsx: z.coerce.boolean().default(true),
  tailwind: z.object({
    config: z.string().optional(),
    css: z.string(),
    baseColor: z.string(),
    cssVariables: z.boolean().default(true),
    prefix: z.string().default("").optional(),
  }),
  aliases: z.object({
    components: z.string(),
    utils: z.string(),
    ui: z.string().optional(),
    lib: z.string().optional(),
    hooks: z.string().optional(),
  }),
  iconLibrary: z.string().optional(),
}).strict()

export type RawConfig = z.infer<typeof rawConfigSchema>

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    tailwindConfig: z.string(),
    tailwindCss: z.string(),
    utils: z.string(),
    components: z.string(),
    lib: z.string(),
    hooks: z.string(),
    ui: z.string(),
  }),
})

export type Config = z.infer<typeof configSchema>

export const workspaceConfigSchema = z.record(configSchema)


export async function getConfig(cwd: string): Promise<Config | null> {
  const config = await getRawConfig(cwd)
  if(!config) {
    return null
  }

  if (!config.iconLibrary) {
    config.iconLibrary = config.style === 'new-tork' ? 'radix' : 'lucide'
  }

  return await resolveConfig(config, cwd)
}


export async function resolveConfig(config: RawConfig, cwd: string): Promise<Config> {
  const tsConfig = await loadConfig(cwd) // TODO: we could try setting default tsconfig path
  
  if(tsConfig.resultType === "failed") {
    throw new Error(
      `Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${
        tsConfig.message ?? ""
      }`.trim()
    )
  }

  const utilsResolvePath = await resolveImport(config.aliases["utils"], tsConfig)
  const componentResolvePath = await resolveImport(config.aliases["components"], tsConfig)
  const libResolvePath = config.aliases["lib"] && await resolveImport(config.aliases["lib"], tsConfig)
  const hooksResolvePath = config.aliases["hooks"] && await resolveImport(config.aliases["hooks"], tsConfig)
  
  return configSchema.parse({
    ...config,
    resolvePaths: {
      cwd,
      tailwindConfig: config.tailwind.config ? path.resolve(cwd, config.tailwind.config) : '', // TODO: we could try setting default tailwind path
      tailwindCss: path.resolve(cwd, config.tailwind.css) || DEFAULT_TAILWIND_CSS,
      utils: utilsResolvePath,
      components: componentResolvePath,
      ui: config.aliases["ui"] ? componentResolvePath : path.resolve((componentResolvePath) ?? cwd, "ui"), 
      // TODO: Make this configurable.
      // For now, the lib and hooks directories are one level up from the components directory. (credit: @sadcn)
      lib: config.aliases['lib'] ? libResolvePath : path.resolve((libResolvePath) ?? cwd, ".."),
      hooks: config.aliases['hooks'] ? hooksResolvePath : path.resolve((hooksResolvePath) ?? cwd, "..")
    }
  })
}


export async function getRawConfig(cwd: string): Promise<RawConfig | null> {
  try{
    const result = await explorer.search(cwd)
  
    if(!result) {
      return null
    }
  
    return rawConfigSchema.parse(result.config)
  } catch (error: any) {
    const componentPath = `${cwd}/components.json`
    throw new Error(
      `Invalid configuration found in ${highlighter.info(componentPath)}.\nError: ${highlighter.error(error.message)}`
    )
  }
}

// Note: checking for -workspace.yaml or "workspace" in package.json.
// Since cwd is not necessarily the root of the project.
// We'll instead check if ui aliases resolve to a different root.
export async function getWorkspaceConfig(config: Config): Promise<Record<string, Config> | null> {
  let resolvedAliases:  any = {}

  Object.keys(config.aliases).forEach(async (key) => {
    if (
      !(Object.keys(config.resolvedPaths)
      .filter((key) => key !== 'utils')
      .includes(key))
    ) {
      return;
    }

    const resolvedPath = config.resolvedPaths[key as keyof Config["resolvedPaths"]]
    const packageRoot = await findPackageRoot(
      config.resolvedPaths.cwd,
      resolvedPath
    )

    if(!packageRoot) {
      resolvedAliases[key] = config
      return null;
    }

    resolvedAliases[key] = await getConfig(packageRoot)
  });


  const result = workspaceConfigSchema.safeParse(resolvedAliases)

  if(!result.success) {
    return null
  }

  return result.data
}

// function isAliasKey(
//   key: string,
//   config: Config
// ): key is keyof Config["aliases"] {
//   return Object.keys(config.resolvedPaths)
//     .filter((key) => key !== "utils")
//     .includes(key)
// }

export async function findPackageRoot(cwd: string, resolvedPath: string) : Promise<string | null> {
  const commonRoot = findCommonRoot(cwd, resolvedPath)
  const relativePath = path.relative(commonRoot, resolvedPath)

  const packageRoots = await fg.glob("**/package.json",
  {
    cwd: commonRoot,
    deep: 3,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/public/**"],
  })

  const matchingPackageRoot = packageRoots
    .map((packageRoot) => path.dirname(packageRoot))
    .find((packageDir) => relativePath.startsWith(packageDir))

    return matchingPackageRoot ? path.join(commonRoot, path.dirname(matchingPackageRoot)) : null
}

export function findCommonRoot(cwd: string, resolvedPath: string): string {
  if (!cwd || !resolvedPath) {
    return cwd
  }

  const cwdParts = cwd.split(path.sep)
  const resolvedPathParts = resolvedPath.split(path.sep)

  let commonRoot = ""

  for (let i = 0; i < Math.min(cwdParts.length, resolvedPathParts.length); i++) {
    if (cwdParts[i] === resolvedPathParts[i]) {
      commonRoot += cwdParts[i] + path.sep
    } else {
      break
    }
  }

  return commonRoot as string
}


// TODO: Cache this call.
export async function getTargetStyleFromConfig(cwd: string, fallback: string) {
  const projectInfo = await getProjectInfo(cwd)
  return projectInfo?.tailwindVersion === "v4" ? "new-york-v4" : fallback
}