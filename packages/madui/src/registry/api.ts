import isUrl from '@/utils/isUrl'
import { handleError } from '@/utils/handle-error' 
import { logger } from '@/utils/logger'
// import axios from 'axios'
import { z } from 'zod'

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
    const response = await fecthRegistry([
      isUrl(name) ? name : `styles/${style}/${name}.json`,
    ])

    return RegistryItemSchema.parse(response);
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
    const [result] = await fetchRegistry([`colors/${baseColor}.json`])

    return registryBaseColorSchema.parse(result)
  } catch (error) {
    handleError(error)
    return null
  }
}