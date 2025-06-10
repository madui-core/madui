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
  stylesSchema
} from './schema'
import axios from 'axios'
import { z } from 'zod'

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
  try {
    const res = await fetchRegistry(['index.json'])

    return registryIndexSchema.parse(res)
  } catch (error) {
    handleError(error)
    return null
  }
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

// export async function getRegistryBaseColor(baseColor: string) {
//   try {
//     const [result] = await fetchRegistry([`colors/${baseColor}.json`])
//     return registryBaseColorSchema.parse(result)
//   } catch (error) {
//     handleError(error)
//     return null
//   }
// }

export async function fetchRegistry(paths: string[], flexFetch = false) {
  try {
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
         * we are planning to move to node.js 
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
  } catch (error) {
    logger.break()
    handleError(error)
  }
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


  } catch (error) {
    handleError(error)
    return null
  }
} 
