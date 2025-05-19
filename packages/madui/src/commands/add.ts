import path from "path";
import isUrl from "@/utils/isUrl";
import { getRegistryItem } from "@/registry/api"
import { Command } from "commander";
import { z } from "zod";

export const addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  force: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
  silent: z.boolean(),
  verbose: z.boolean(),
  srcDir: z.boolean(),
  cssVariables: z.boolean(),
  install: z.boolean(),
  git: z.boolean(),
  noInstall: z.boolean(),
  noGit: z.boolean()
})

export const add = new Command()
  .name("add")
  .description("add madui components to your project")
  .argument(
    "[components...]",
    "components to add or a url to a madui component")
  .option("-y, --yes", "skip configuraion prompts", false)
  .option("-o, --overwrite, -f, --force", "overwrite existing files", false)
  .option(
    "-c, --cwd <cwd>", 
    "the directory to add components to, default to current working directory",
    process.cwd()
  )
  .option("-a, --all", "add all available components", false)
  .option("-p, --path <path>", "the path to add components to")
  .option("-s, --silent", "mute output", false)
  .option("-v, --verbose", "output the full error stack trace", false)
  .option("--src-dir", "use the source directory when creating new project.")
  .option("--no-src-dir", "do not use the source directory when creating new project.")
  .option("--css-variables", "use css varoables for theming", false)
  .option("--no-css-varibnles", "do not use css variables for theming", false)
  
  .option("--no-install", "do not install dependencies", false)
  .option("--no-git", "do not initialise a git repository", false)
  .action(async (components: any , opts: any) => {
    try {
      const parsedOptions = addOptionsSchema.parse({
        components, 
        cwd: path.resolve(opts.cwd || process.cwd()), // where this return the cwd
        ...opts
      })

      let itemType: z.infer<typeof registryItemTypeSchema> | undefined = undefined 

      if(components.length > 0 && isUrl(components[0])) {
        const item = await getRegistryItem(components[0], "")
        itemType = item.type
      }

      



    } catch (error) {

    }
  })
  
  
