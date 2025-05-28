// import path from 'path'
import isUrl from '@/utils/isUrl'
import { handleError } from '@/utils/handle-error' 
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import { Verbose } from '@/verbose/logger'
import axios from 'axios'
// import { z } from 'zod'

import {
  registryItemSchema
} from './schema'
import { FileX } from 'lucide-react'

const REGISTRY_URL = process.env.REGISTRY_URL ?? 'http://localhost:3000'

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