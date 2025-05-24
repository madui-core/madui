import { z } from 'zod'

export const registryItemTypeSchema = z.enum([
  "registry:lib",
  "registry:block",
  "registry:page",
  "registry:componenet",
  "registry:theme",
  "registry:style",
  "registry:hook",
  "registry:file",
  "registry:ui"
])

export const registryItemSchema = z.object({
  $schema: z.string().optional(),
  extends: z.string().optional(),
  name: z.string(),
  type: registryItemTypeSchema,
  version: z.string().optional(),
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
})