// import path from 'path'
import isUrl from '@/utils/isUrl'
import { Config, getTargetStyleFromConfig } from '@/utils/get-config'
import { handleError } from '@/utils/handle-error' 
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { Verbose } from '@/verbose/logger'
import {
  registryItemSchema,
  registryIndexSchema,
  registryBaseColorSchema,
  stylesSchema,
} from './schema'
import axios from 'axios'
import { z } from 'zod'
import { getProjectTailwindVersionFromConfig } from '@/utils/get-project-info'
import { buildTailwindThemeColorsFromCssVars } from '@/utils/updaters/update-tailwind-config'
import { registryResolvedItemsTreeSchema, iconsSchema } from './schema'
import deepmerge from 'deepmerge'

const REGISTRY_URL = process.env.REGISTRY_URL ?? 'http://localhost:3000/r'

const registryCache = new Map<string,
    {
      response: Promise<any>,
      flexFlex: boolean,
    }
  >()


export const BASE_COLORS = [
  {
    name: "neutral",
    label: "Neutral",
  },
  {
    name: "gray",
    label: "Gray",
  },
  {
    name: "zinc",
    label: "Zinc",
  },
  {
    name: "stone",
    label: "Stone",
  },
  {
    name: "slate",
    label: "Slate",
  },
] as const

function getRegistryUrl(path: string) {
  if (isUrl(path)) {
    /**
     * 
     * VERCEL supports is not yet available
     * 
     */
    return path
  }

  return `${REGISTRY_URL}/${path}`
}

export async function getRegistryIndex() {
  // try {
    const res = await fetchRegistry(['index.json'])
    console.log('res', res)


    if (!res) {
      return null
    }


    return registryIndexSchema.parse(res[0])
  // } catch (error) {
  //   handleError(error)
  //   return null
  // }
} 

export async function getRegistryStyles() {
  try {
    const res = await fetchRegistry(['styles/index.json'])
    if (!res) {
      return {}
    }
    const [result] = res

    return stylesSchema.parse(result)
  } catch (error) {
    logger.break()
    handleError(error)
    return {}
  }
}

export async function getRegistryItem(name: string, style: string, keys: Set<string> | null = null) {
  try {
    Verbose(`Fetching registry item ${isUrl(name)?'from url':'' } ${highlighter.info(name)}`)
    const url =
      isUrl(name)
        ? name
        : `${keys? 'api/' : ''}
        styles/${style}/${name}.json
        ${keys
          && (keys.size === 1
            ? `?key=${Array.from(keys)[0]}`
            : `?keys=${Array.from(keys).join(',')}`)}`

    const response = await fetchRegistry([url], !!keys)

    if (!response) Verbose(`No registry item found`) 

    return registryItemSchema.parse(response);
  } catch (error) {
    logger.break()
    handleError(error)
    return null
  }
}

export async function getRegistryBaseColors() {
  return BASE_COLORS
}

export async function getRegistryBaseColor(baseColor: string) {
  try {
    const result = await fetchRegistry([`colors/${baseColor}.json`])
    return registryBaseColorSchema.parse(result)
  } catch (error) {
    handleError(error)
    return null
  }
}


export async function registryGetTheme(name: string, config: Config) {
  /**
   * --GET tailwind version without an fetch request from the root
   */
  
  const [ baseColor, tailwindVersion ] = await Promise.all([
    getRegistryBaseColor(name),
    getProjectTailwindVersionFromConfig(config),
  ])
  if (!baseColor) {
    return null
  }

  // SO SOME TODO: Move this to registry:theme
  const theme = {
    name,
    type: "registry:theme",
    tailwind: {
      config: {
        theme: {
          extend: {
            borderRadius: {
              lg: "var(--radius)",
              md: "calc(var(--radius) - 2px)",
              sm: "calc(var(--radius) - 4px)",
            },
            colors: {},
          },
        },
      },
    },
    cssVars: {
      theme: {},
      light: {
        radius: "0.5rem",
      },
      dark: {},
    },
  } satisfies z.infer<typeof registryItemSchema>

  if (config.tailwind.cssVariables) {
    theme.tailwind.config.theme.extend.colors = {
      ...theme.tailwind.config.theme.extend.colors,
      ...buildTailwindThemeColorsFromCssVars(baseColor.cssVars.dark ?? {}),
    }
    theme.cssVars = {
      theme: {
        ...baseColor.cssVars.theme,
        ...theme.cssVars.theme,
      },
      light: {
        ...baseColor.cssVars.light,
        ...theme.cssVars.light,
      },
      dark: {
        ...baseColor.cssVars.dark,
        ...theme.cssVars.dark,
      },
    }

    if (tailwindVersion === 'v4' && baseColor.cssVarsV4) {
      theme.cssVars.theme = {
       theme: {
          ...baseColor.cssVarsV4.theme,
          ...theme.cssVars.theme,
        },
        light: {
          radius: "0.625rem",
          ...baseColor.cssVarsV4.light,
        },
        dark: {
          ...baseColor.cssVarsV4.dark,
        }, 
      }
    }
  }
  
  return theme
}

export async function fetchRegistry(paths: string[], flexFetch = false) {
  // try {
    const res = await Promise.all(
      paths.map( async (path) => {
        const url = getRegistryUrl(path)

        Verbose('Checking registry cache...')
        if (registryCache.has(url)) {
          const cachedItem = registryCache.get(url)
          if (
            !(!flexFetch && cachedItem?.flexFlex)
          ) {
            return registryCache.get(url)
          }
        }
        

        Verbose(`Fetching registry item from ${highlighter.info(url)}`)
        /**
         * TODO: for backend, currently using NextJS
         * planning to move to node.js 
         */
        const fetch = (async () => {
          const response = await axios.get(url, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'madui-cli',
            }
          })

          if (response.status === 401) {
            throw new Error(
              `You are not authorized to access the component at ${highlighter.info(
                url
              )}.\nIf this is a remote registry, you may need to authenticate.`
            )
          }

          if (response.status === 404) {
            throw new Error(
              `The component at ${highlighter.info(
                url
              )} was not found.\nIt may not exist at the registry. Please make sure it is a valid component.`
            )
          }

          if (response.status === 403) {
            throw new Error(
              `You do not have access to the component at ${highlighter.info(
                url
              )}.\nIf this is a remote registry, you may need to authenticate or a token.`
            )
          }

          if (response.status !== 200) {
            throw new Error(
              `Failed to fetch the component at ${highlighter.info(
                url
              )}.\nPlease check your network connection and try again.`
            )
          }

          const data = response.data
          if (typeof data !== 'object') {
            throw new Error(
              `The component at ${highlighter.info(
                url
              )} is not a valid JSON object.\nPlease check the component and try again.`
            )
          }

          registryCache.set(url,
            {
              response: Promise.resolve(data),
              flexFlex: flexFetch
            })
          Verbose(`Fetched registry item ${highlighter.info(data.name)}`)

          return data
        })

        return fetch()
      })
    )

    if (res.some(item => item === undefined)) {
      throw new Error(
        `Failed to fetch some registry items. Please check your network connection and try again.`
      )
    }

    return res
  // } catch (error) {
  //   logger.break()
  //   console.log('here i am')
  //   handleError(error)
  //   return []
  // }
}

export async function resovleRegistryDependencis(
  Url: string,
  config: Config
) : Promise<string[]>{
  const visited = new Set<string>()
  const dependencies: string[] = []

  const style = config.resolvedPaths?.cwd?
    await getTargetStyleFromConfig(config.resolvedPaths.cwd, config.style)
    : config.style

  async function resolveDependencies(Url: string) {
    const url = getRegistryUrl(
      isUrl(Url) ? Url : `styles/${style}/${Url}.json`
    )
  
    if (visited.has(url)) {
      return
    }
  
    visited.add(url)
  
    try {
      const response = await fetchRegistry([url], true)
      const item = registryItemSchema.parse(response)
      dependencies.push(url)
  
      if (item?.registryDependencies) {
        for (const dep of item.registryDependencies) {
          await resolveDependencies(dep)
        }
      }
    } catch (error) {
      console.error(
        `Error fetching or parsing registry item at ${Url}:`,
        error
      )
    }
  }

  await resolveDependencies(Url)
  logger.info('resolved dependencies - ', Array.from(new Set(dependencies)))
  return Array.from(new Set(dependencies))
}

const dependenciesCache = new Map<string, string[]>()
export async function resolveRegistryItems(
  components: string[],
  config: Config
) {
  let registryDependencies: string[] = []
  for (const componenet of components) { 
    if (dependenciesCache.has(componenet)) {
      registryDependencies.push(...dependenciesCache.get(componenet)!)
      continue
    }
    const itemRegistryDependencies = await resovleRegistryDependencis(componenet, config)
    registryDependencies.push(...itemRegistryDependencies)
    dependenciesCache.set(componenet, itemRegistryDependencies)
  }

  return Array.from(new Set(registryDependencies))
}


export async function registryResolveItemsTree(
  components: z.infer<typeof registryItemSchema>["name"][],
  config: Config
) {
  try {
    const index = await getRegistryIndex()
    if (!index) {
      return null
    }

    // if we are resolving index, it should be in the starting of the index
    if (components.includes('index')) {
      logger.info('We found index - Great! what next?')
      components.unshift('index')
    }

    let registryItems = await resolveRegistryItems(components, config)
    let result = await fetchRegistry(registryItems)
    const payload = z.array(registryItemSchema).parse(result)

    if (!payload || payload.length === 0) {
      return null
    }

    // if we are resolving index, we want to fetch the theme item if a base color is provided
    // we do this for index only
    // other components will be resolved with their theme token
    if (components.includes('index')) {
      if (config.tailwind?.baseColor) {
        const theme = await registryGetTheme(config.tailwind.baseColor, config)
        if (theme) {
          payload.unshift(theme)
        }
      }
    }

    /**
     * 1. sort the payload
     * 2. extract every info
     * 3. return the registry tree
     */

    // Sort the payload so that registry:theme is always first.
    payload.sort((a, b) => {
      if (a.type === "registry:theme") {
        return -1
      }
      return 1
    })

    let tailwind = {}
    payload.forEach((item) => {
      tailwind = deepmerge(tailwind, item.tailwind ?? {})
    })

    let cssVars = {}
    payload.forEach((item) => {
      cssVars = deepmerge(cssVars, item.cssVars ?? {})
    })

    let css = {}
    payload.forEach((item) => {
      css = deepmerge(css, item.css ?? {})
    })

    let docs = ""
    payload.forEach((item) => {
      if (item.docs) {
        docs += `${item.docs}\n`
      }
    })

    return registryResolvedItemsTreeSchema.parse({
      dependencies: deepmerge.all(
        payload.map((item) => item.dependencies ?? [])
      ),
      devDependencies: deepmerge.all(
        payload.map((item) => item.devDependencies ?? [])
      ),
      files: deepmerge.all(payload.map((item) => item.files ?? [])),
      tailwind,
      cssVars,
      css,
      docs,
    })
  } catch (error) {
    handleError(error)
    return null
  }
} 

export async function getRegistryIcons() {
  try {
    const [result] = await fetchRegistry(["icons/index.json"])
    return iconsSchema.parse(result)
  } catch (error) {
    handleError(error)
    return {}
  }
}

// Track a dependency and its parent.
export function getRegistryParentMap(
  registryItems: z.infer<typeof registryItemSchema>[]
) {
  const map = new Map<string, z.infer<typeof registryItemSchema>>()
  registryItems.forEach((item) => {
    if (!item.registryDependencies) {
      return
    }

    item.registryDependencies.forEach((dependency) => {
      map.set(dependency, item)
    })
  })
  return map
}

export function getRegistryTypeAliasMap() {
  return new Map<string, string>([
    ["registry:ui", "ui"],
    ["registry:lib", "lib"],
    ["registry:hook", "hooks"],
    ["registry:block", "components"],
    ["registry:component", "components"],
  ])
}
