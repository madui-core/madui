import path from 'path'
import { FRAMEWORKS, Framework } from '@/utils/framework'
import {
  Config,
  RawConfig,
  getConfig,
  resolveConfig,
} from '@/utils/get-config'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { loadConfig } from "tsconfig-paths"
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

  // TODO: try finding better way to detect if the project is App Route and Pages Route
  const isUsingAppDir = await fs.pathExists(
    path.resolve(cwd, `${isSrcDir ? 'src/' : ""}app`)
  )

  const type: ProjectInfo = {
    framework: FRAMEWORKS['manual'],
    isSrcDir,
    isRSC: false,
    isTsx,
    tailwindConfigFile,
    tailwindCssFile,
    tailwindVersion,
    aliasPrefix,
  }

  // NextJS
  if (configFiles.find((file: string) => file.startsWith("next.config."))?.length){
    type.framework = isUsingAppDir
      ? FRAMEWORKS['next-app']
      : FRAMEWORKS['next-pages']
    type.isRSC = isUsingAppDir
    return type
  }

  // Astro.
  if (configFiles.find((file: string) => file.startsWith("astro.config."))?.length) {
    type.framework = FRAMEWORKS["astro"]
    return type
  }

  // Gatsby.
  if (configFiles.find((file: string) => file.startsWith("gatsby-config."))?.length) {
    type.framework = FRAMEWORKS["gatsby"]
    return type
  }

  // Laravel.
  if (configFiles.find((file: string) => file.startsWith("composer.json"))?.length) {
    type.framework = FRAMEWORKS["laravel"]
    return type
  }

  // Remix.
  if (
    Object.keys(packageJson?.dependencies ?? {}).find((dep) =>
      dep.startsWith("@remix-run/")
    )
  ) {
    type.framework = FRAMEWORKS["remix"]
    return type
  }

  // TanStack Start.
  if (
    configFiles.find((file: string) => file.startsWith("app.config."))?.length &&
    [
      ...Object.keys(packageJson?.dependencies ?? {}),
      ...Object.keys(packageJson?.devDependencies ?? {}),
    ].find((dep) => dep.startsWith("@tanstack/start"))
  ) {
    type.framework = FRAMEWORKS["tanstack-start"]
    return type
  }


  // React Router
  if (configFiles.find((file: string) => file.startsWith("react-router.config."))?.length) {
    type.framework = FRAMEWORKS['react-router']
    return type
  }

  // Vite.
  // Some Remix templates also have a vite.config.* file.
  // their is a chances of it get caught by the Remix check above.
  if (configFiles.find((file: string) => file.startsWith("vite.cinfig."))?.length || packageJson?.vite) {
    type.framework = FRAMEWORKS['vite']
    return type
  }

  return type
}



export async function getTailwindVersion(cwd: string): Promise<TailwindVersion | null> {
  const [packageJson, config] Promise.all([
    getPackage
  ])
}


export async function getTailwindVersionFromConfig(config: Config): Promise<TailwindVersion> {
  if (!config.resolvedPaths?.cwd) {
    return 'v3'
  }



  return 'v4'
}
