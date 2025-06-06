import path from 'path'
import { FRAMEWORKS, Framework } from '@/utils/framework'
import {
  Config,
  RawConfig,
  getConfig,
  resolveConfig,
} from '@/utils/get-config'
import { getPackageInfo } from '@/utils/get-package-info'
import { highlighter } from './highlighter'
import { logger } from './logger'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { loadConfig } from "tsconfig-paths"
import { z } from 'zod'

const LIVE_HOST = process.env.MADUI_HOST || "http://localhost:3000"

export type TailwindVersion = "v3" | "v4" | null

export type ProjectInfo = {
  framework: Framework
  isSrcDir: boolean
  isRSC: boolean
  isTsx: boolean
  tailwindConfigFile: string | null
  tailwindCssFile: {file: string, versionMissMatch: boolean} | null
  tailwindVersion: TailwindVersion
  aliasPrefix: string | null
}

const PROJECT_SHARED_IGNORE = ["**/node_modules/**", ".next", "public", "dist", "build",]

const TS_CONFIG_SCHEMA = z.object({
  compilerOptions: z.object({
    path: z.record(z.string().or(z.array(z.string())))
  })
})

export async function getProjectInfo(cwd: string): Promise<ProjectInfo> {
  const tailwindVersion: TailwindVersion = await getTailwindVersion(cwd)
  // TODO: since tailwind is important and finding tailwindCssFile and Config make no sense if tailwind is not install
  // therefore ask user to `run the install --save-dev tailwindcss`

  if (!tailwindVersion) {
    logger.info(highlighter.error("Tailwind CSS is not installed, install it by running `npm install -D tailwindcss` or `yarn add -D tailwindcss`"))
  }

  const [
    configFiles,
    isSrcDir,
    isTsx,
    tailwindConfigFile,
    tailwindCssFile,
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
    isTypeScriptProject(cwd),
    getTailwindConfigFile(cwd),
    getTailwindCssFile(cwd, tailwindVersion),
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


export async function getTailwindVersion(cwd: string): Promise<TailwindVersion> {
  const [packageJson, config] = await Promise.all([
    getPackageInfo(cwd, false),
    getConfig(cwd)
  ])

  // If the config file is empty, then assuming that it's a v4 project.
  if (config?.tailwind?.config === "") {
    return "v4"
  }

  if (
    !packageJson?.dependencies?.tailwindcss &&
    !packageJson?.devDependencies?.tailwindcss
  ) {
    return null
  }

  if (
    /^(?:\^|~)?3(?:\.\d+)*(?:-.*)?$/.test(
      packageJson?.dependencies?.tailwindcss ||
      packageJson?.devDependencies?.tailwindcss ||
      ""
    )
  ) {
    return "v3"
  }

  return 'v4'
}

export async function getTailwindCssFile(cwd: string, tailwindVersion: TailwindVersion)
: Promise<{
  file: string,
  versionMissMatch: boolean
} | null > {
  const files = await fg.glob(["**/.css", "**/.scss"],
    {
      cwd,
      deep: 5,
      ignore: PROJECT_SHARED_IGNORE
    })

  if (!files.length) return null

  for(const file of files) {
    const contents = await fs.readFile(path.resolve(cwd, file), "utf-8")
     if (
      contents.includes(`@import "tailwindcss"`) ||
      contents.includes(`@import 'tailwindcss'`)
    ) {
      return {
        file: file,
        versionMissMatch: !(tailwindVersion !== "v4")
      }
    } else if (
      contents.includes(`@tailwind base`)
    ) {
      return {
        file: file,
        versionMissMatch: false
      }
    }
  }
  
  return null
}

export async function getTailwindConfigFile(cwd: string) {
  const files = await fg.glob("tailwind.config.*", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE,
  })

  if (!files.length) {
    return null
  }

  return files[0]
}


export async function getTsConfigAliasPrefix(cwd: string) {
  const tsConfig = await loadConfig(cwd)

  if (
    tsConfig?.resultType === "failed" ||
    !Object.entries(tsConfig?.paths).length
  ) {
    return null
  }

  // This assume that the first alias is the prefix.
  for (const [alias, paths] of Object.entries(tsConfig.paths)) {
    if (
      paths.includes("./*") ||
      paths.includes("./src/*") ||
      paths.includes("./app/*") ||
      paths.includes("./resources/js/*") // Laravel.
    ) {
      return alias.replace(/\/\*$/, "") ?? null // remove the last slash WHY I DONT KNOW
    }
  }

  // Use the first alias as the prefix.
  return Object.keys(tsConfig?.paths)?.[0].replace(/\/\*$/, "") ?? null
}


export async function isTypeScriptProject(cwd: string) {
  const files = await fg.glob("tsconfig.*", {
    cwd,
    deep: 1,
    ignore: PROJECT_SHARED_IGNORE,
  })

  return files.length > 0
}

export async function getTsConfig(cwd: string) {
  for (const fallback of [
    "tsconfig.json",
    "tsconfig.web.json",
    "tsconfig.app.json",
  ]) {
    const filePath = path.resolve(cwd, fallback)
    if (!(await fs.pathExists(filePath))) {
      continue
    }

    const contents = await fs.readFile(filePath, "utf8")
    const cleanedContents = contents.replace(/\/\*\s*\*\//g, "")
    const res = TS_CONFIG_SCHEMA.safeParse(JSON.parse(cleanedContents))

    if(res.error) {
      return null
    }

    return res.data
  }

  return null
}


export async function getProjectConfig(
  cwd: string,
  defaultProjectInfo: ProjectInfo | null = null
): Promise<Config | null> {
  // Check for existing component config.
  const [existingConfig, projectInfo] = await Promise.all([
    getConfig(cwd),
    !defaultProjectInfo
      ? getProjectInfo(cwd)
      : Promise.resolve(defaultProjectInfo),
  ])

  if (existingConfig) {
    return existingConfig
  }

  if (
    !projectInfo ||
    !projectInfo.tailwindCssFile ||
    (projectInfo.tailwindVersion === "v3" && !projectInfo.tailwindConfigFile)
  ) {
    return null
  }


  const config: RawConfig = {
    $schema: `https://${LIVE_HOST}/schema.json`,
    rsc: projectInfo.isRSC,
    tsx: projectInfo.isTsx,
    style: "new-york",
    tailwind: {
      config: projectInfo.tailwindConfigFile ?? "",
      baseColor: "zinc",
      css: projectInfo.tailwindCssFile.file,
      cssVariables: true,
      prefix: "",
    },
    iconLibrary: "lucide",
    aliases: {
      components: `${projectInfo.aliasPrefix}/components`,
      ui: `${projectInfo.aliasPrefix}/components/ui`,
      hooks: `${projectInfo.aliasPrefix}/hooks`,
      lib: `${projectInfo.aliasPrefix}/lib`,
      utils: `${projectInfo.aliasPrefix}/lib/utils`,
    },
  }

  return await resolveConfig(config ,cwd)
}

export async function getProjectTailwindVersionFromConfig(config: Config) : Promise<TailwindVersion> {
  if(!config.resolvedPaths?.cwd) {
    return "v3"
  }

  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd)

  if (!projectInfo?.tailwindVersion) {
    return null
  }
  
  return projectInfo.tailwindVersion
}