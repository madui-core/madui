import path from 'path'
import { resolveImport } from "@/src/utils/resolve-import"
import { cosmiconfig } from "cosmiconfig"
import { z } from "zod"
import { Component } from 'lucide-react'

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


export async function getConfig(cwd: string): Promise<Config | null> {
  const config = await getRawConfig(cwd)
  if(!config) {
    return null
  }

  if (!config.iconLibarary) {
    config.iconLibrary = config.style === 'new-tork' ? 'radix' : 'lucide'
  }

  return await resolveConfig(config, cwd)
}


export async function resolveConfig(config: Config, cwd: string): Promise<Config> {
  // getting tsconfig.json 
  const tsConfig = await loadConfig(cwd)
  
  if(!tsConfig.result) {
    throw new Error(
      `Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${
        tsConfig.message ?? ""
      }`.trim()
    )
  }

  const utilsResolvePath = await resolveImport(config.aliases["utils"], tsConfig)
  const componentResolvePath = await resolveImport(config.aliases["components"], tsConfig)
  const libResolvePath = await resolveImport(config.aliases["lib"], tsConfig)
  const hooksResolvePath = await resolveImport(config.aliases["hooks"], tsConfig)
  
  return configSchema.parse({
    ...config,
    resolvePaths: {
      cwd,
      tailwindConfig: config.tailwind.config ? path.resolve(cwd, config.tailwind.config) : '', // TODO: we could try setting default tailwind path
      tailwindCss: path.resolve(cwd, config.tailwind.css) || DEFAULT_TAILWIND_CSS,
      utils: utilsResolvePath,
      components: componentResolvePath,
      ui: config.aliases["ui"]
        ? await resolveImport(config.aliases["ui"], tsConfig)
        : path.resolve(componentResolvePath, cwd, "ui"), 
      // TODO: Make this configurable.
      // For now, the lib and hooks directories are one level up from the components directory. (credit: @sadcn)
      lib: config.aliases['lib'] ? libResolvePath : path.resolve(libResolvePath, cwd, ".."),
      hooks: config.aliases['hooks'] ? hooksResolvePath : path.resolve(hooksResolvePath, cwd, "..")
    }
  })
}