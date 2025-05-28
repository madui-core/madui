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

export const registryItemFileSchema = z.discriminatedUnion('type', [
  //registry:file or registry:page
  z.object({
    type: z.enum(["registry:file", "registry:page"]),
    path: z.string(),
    content: z.string().optional(),
    target: z.string(),
  }),

  z.object({
    type: registryItemTypeSchema.exclude(["registry:file", "registry:page"]),
    path: z.string(),
    content: z.string().optional(),
    target: z.string().optional(),
  })
])

export const registryItemTailwindSchema = z.object({
  consfig: z.object({
    content: z.array(z.string()).optional(),
    theme: z.record(z.string(), z.any()).optional(),
    plugins: z.array(z.string()).optional(),
  })
  .optional(),
})

export const registryItemCssVarsSchema = z.object({
  theme: z.record(z.string(), z.string()).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional(),
})

export const registryItemCssSchema = z.record(
  z.string(),
  z.lazy(() =>
    z.union([
      z.string(),
      z.record(
        z.string(),
        z.union([z.string(), z.record(z.string(), z.string())])
      ),
    ])
  )
)



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
  devDependencies:
   z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
  tailwind: registryItemTailwindSchema.optional(),
  cssVars: registryItemCssVarsSchema.optional(),
  css: registryItemCssSchema.optional(),
  meta: z.record(z.string(), z.any()).optional(),
})