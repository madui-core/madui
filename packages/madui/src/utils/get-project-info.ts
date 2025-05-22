import path from 'path'
import { FRAMEWORK, Framework } from '@/utils/framework'
import {
  Config
} from '@/utils/get-config'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { z } from 'zod'

export type TailwindVersion = "v3" | "v4"

export type ProjectInfo = {
  framework: Framework
  isSrcDir: boolean
  isRSC: boolean
  isTsx: boolean
  tailwindConfigFile: string | null
  tailwindCssFile: string | null
  tailwindVersion: TailwindVersion
  aliasPrefix: string | null
}

const PROJECT_SHARED_IGNORE = [
  "**/node_modules/**",
  ".next",
  "public",
  "dist",
  "build",
]

const TS_CONFIG_SCHEMA = z.object({
  compilerOptions: z.object({
    path: z.record(z.string().or(z.array(z.string())))
  })
})

export async function getProjectInfo(cwd: string): Promise<ProjectInfo | null> {
  const [
    configFiles,
    isSrcDir,
    isTsx,
    tailwindConfigFile,
    tailwindCssFile,
    tailwindVersion,
    aliasPrefix,
    packageJson,
  ] = await Promise.all([
    fg.glob(
      '**/{next,vite,astro,app}.config.*|gatsby-config.*|composer.json|react-router.config.*', // |vite.config.*|webpack.config.*
      {
        cwd,
        deep: 3,
        ignore: PROJECT_SHARED_IGNORE,
      }
    ),
    fs.pathExists(path.resolve(cwd, 'src')),
    isTypeScriptsProject(cwd),
    getTailwindConfigFile(cwd),
    getTailwindCssFile(cwd),
    getTailwindVersion(cwd),
    getTsConfigAliasPrefix(cwd),
    getPackageInfo(cwd, false),
  ])


}

export async function getTailwindVersion(cwd: string): Promise<TailwindVersion | null> {

}


export async function getTailwindVersionFromConfig(config: Config): Promise<TailwindVersion> {
  if (!config.resolvedPaths?.cwd) {
    return 'v3'
  }



  return 'v4'
}
