import path from 'path'
import isUrl from '@/utils/isUrl'
import { handleError } from '@/utils/handle-error' 
import { highlighter } from '@/utils/highlighter'
import { logger } from '@/utils/logger'
import axios from 'axios'
import { z } from 'zod'

import {
  registryItemSchema
} from './schema'

const REGISTRY_URL = process.env.REGISTRY_URL ?? 'http://localhost:3000'

// const registryCache = new Map<string, Promise<any>>()


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


export async function getRegistryItem(name: string, style: string) {
  try {
    const response = await fetchRegistry([
      isUrl(name) ? name : `styles/${style}/${name}.json`,
    ])

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


export async function fetchRegistry(paths: string[]) {
  try {
    const res = await Promise.all(
      paths.map( async (path) => {
        const url = getRegistryUrl(path)

        // logger.info(`Fetching registry item from ${highlighter.info(url)}`)

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

          return data
        })

        return fetch()
      })
    )

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