import { initOptionsSchema } from '@/commands/init';
import { fetchRegistry } from '@/registry/api';
import { handleError } from './handle-error';
import { highlighter } from './highlighter';
import { logger } from './logger';
import prompts from 'prompts';
import { z } from 'zod';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';


const AUTHOR_REPO = process.env.AUTHOR_REPO || 'https://github.com/madui-core/madui/issues'

export const TEMPLATES = {
  next: "next",
  // "next-monorepo": "next-monorepo",
} as const

export async function createProject(
  options: Pick<z.infer<typeof initOptionsSchema>,
  "cwd" | "force" | "srcDir" | "components" | "template"
  >
) {
  
  // options = {
  //   srcDir: false,
  //   ...options,
  // }
  
  let template: keyof typeof TEMPLATES = options.template && TEMPLATES[options.template as keyof typeof TEMPLATES]
    ? (options.template as keyof typeof TEMPLATES)
    : "next"

  
  let projectName: string = template === TEMPLATES.next ? "my-app" : "my-monorepo"
  
  // handling project name exists
  try {
    const projectPath = path.resolve(options.cwd, projectName);
    await fs.access(projectPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      projectName += `-${Math.floor(Math.random() * 1000)}`;
    }
    else {
      logger.break();
      logger.error(`Failed to access project path: ${error.message}`);
      logger.error(`Please check the path ${highlighter.info(options.cwd)} and try again.`);
      process.exit(1);
    }
  }


  let nextVersion = 'latest'


  /**
   * Currently no vercel support
   */
  const isRemoteComponent: boolean = false
  /**
  const isRemoteComponent = 
    options.components?.length === 1
    && !!options.components[0].match(/\/chat\/b\//)

  if (options.components && isRemoteComponent) {
    try {
      const result = await fetchRegistry(options.components)

      if (!result) {
        logger.break()
        handleError(new Error("No registry item found for the provided component."))
        process.exit(1)
      }

      const { meta } =
        z.object({
          meta: z.object({
            nextVersion: z.string()
          }),
        })
        .parse(result[0])
      
      nextVersion = meta.nextVersion || 'latest'
      template = TEMPLATES.next
    } catch (error) {
      logger.break()
      handleError(error)
    }
  }
  */


  if (!options.force) {
    const {type, name} = await prompts([
      {
        type: options.template || isRemoteComponent ? null : "select",
        name: "type",
        message: `It's look like path ${highlighter.info(options.cwd)} does not contain package.json.\n
        Would you like to initialize a new project?`,
        choices: [
          {title: "NextJS", value: "next"},
        ],
        initial: 0,
      },
      {
        type: "text",
        name: "name",
        message: `Too lazy to name your project? Just hit ${highlighter.info('<Enter>')}\n`,
        initial: projectName,
        format: (value: string) => value.trim().slice(0, 128),
      },
    ])

    template = type ?? template
    projectName = name || projectName
  }

  const packageManager = await getPackageManager(options.cwd, {
    withFallback: true,
  })


  
  let projectDir = path.resolve(options.cwd, projectName)
  // check if path is writable
  const tempFile = path.join(options.cwd, `.temp-${Date.now()}.txt`);
  try {
    await fs.writeFile(tempFile, 'test');
    await fs.unlink(tempFile);
  } catch (error: any) {
    logger.break();
    logger.error(`The path ${highlighter.info(options.cwd)} is not writable.\n
    See error below, and if the issue persists, open the issue on the author's github (${highlighter.info(AUTHOR_REPO)})\n `);
    logger.error(
      `${highlighter.info(error.message)}`
    );
    logger.break();
    process.exit(1);
  }

  
  projectDir = path.resolve(options.cwd, projectName);

  try {
    await fs.access(projectDir, fs.constants.F_OK);
  
    logger.break();
    logger.error(`A project with the name ${highlighter.info(projectName)} already exists.`);
    logger.error("Please choose a different name and try again.");
    logger.break();
    process.exit(1);
  } catch {
    // Folder doesn't exist - continue
  }


  if (template === TEMPLATES.next) {
    await createNextProject(projectPath, {

    })
  }

  

  return null
}