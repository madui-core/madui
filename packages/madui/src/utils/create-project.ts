import { initOptionsSchema } from '@/commands/init';
import { fetchRegistry } from '@/registry/api';
import { handleError } from './handle-error';
import { highlighter } from './highlighter';
import { logger } from './logger';
import { spinner } from './spinner';
import prompts from 'prompts';
import path from 'path';
import { z } from 'zod';
import { execa } from 'execa';
import fs from 'fs';
import os from 'os';
import { getPackageManager } from './get-package-manager';


const AUTHOR_REPO = process.env.AUTHOR_REPO || 'https://github.com/madui-core/madui/issues'
const MONOREPO_TEMPLATE_URL =""

export const TEMPLATES = {
  next: "next",
  // "next-monorepo": "next-monorepo",
} as const


/**
 * Planning to remove this function in future
 */

function checkDirectory(cwd: string, projectName: string) {
  const projectPath = path.resolve(cwd, projectName);
  try {
    fs.mkdirSync(projectPath);
  } catch (error: any){
    if (error.code === 'EEXIST') {
      // Use a stream to check for the first entry
      const stream = fs.createReadStream(projectPath);
      let isEmpty = true;

      stream.on('data', () => {
        isEmpty = false;
        stream.close();
      });

      stream.on('end', () => {
        if (!isEmpty) {
          console.error(`Directory ${projectName} already exists and is not empty.`);
          process.exit(1);
        }
        // Directory is empty - continue
      });

      stream.on('error', (readError: any) => {
        console.error(`Cannot read directory ${projectName}: ${readError.message}`);
        process.exit(1);
      });
    } else {
      const msg =
        error.code === 'EACCES' || error.code === 'EPERM'
          ? `Path ${cwd} is not writable.`
          : error.code === 'ENOENT'
          ? `Path ${cwd} does not exist.`
          : `Failed to create directory: ${error.message}`;

      console.error(msg);
      process.exit(1);
    }
  }
}



export async function createProject(
  options: Pick<z.infer<typeof initOptionsSchema>,
  "cwd" | "force" | "srcDir" | "components" | "template"
  >
): Promise<{
  projectPath: string;
  projectName: string;
  template: keyof typeof TEMPLATES;
}> {
  // options = {
  //   srcDir: false,
  //   ...options,
  // }
  


  let template: keyof typeof TEMPLATES = options.template && TEMPLATES[options.template as keyof typeof TEMPLATES]
    ? (options.template as keyof typeof TEMPLATES)
    : "next"

  let projectName: string = template === TEMPLATES.next ? "my-app" : "my-monorepo"
  const nextVersion = 'latest'


  /**
   * To Optimise the code we have currently remove checking for my-app name
   * but, could consider this in future
   */  
  projectName += `-${Math.floor(Math.random() * 1000)}`;
  // handling project name exists
  // try {
  //   const projectPath = path.resolve(options.cwd, projectName);
  //   await fs.access(projectPath);
  // } catch (error: any) {
  //   if (error.code === 'ENOENT') {
  //     projectName += `-${Math.floor(Math.random() * 1000)}`;
  //   }
  //   else {
  //     logger.break();
  //     logger.error(`Failed to access project path: ${error.message}`);
  //     logger.error(`Please check the path ${highlighter.info(options.cwd)} and try again.`);
  //     process.exit(1);
  //   }
  // }




  /**
   * @Look Currently no vercel support
   */
  const isRemoteComponent: boolean = false
  
  // const isRemoteComponent = 
  //   options.components?.length === 1
  //   && !!options.components[0].match(/\/chat\/b\//)

  // if (options.components && isRemoteComponent) {
  //   try {
  //     const result = await fetchRegistry(options.components)

  //     if (!result) {
  //       logger.break()
  //       handleError(new Error("No registry item found for the provided component."))
  //       process.exit(1)
  //     }

  //     const { meta } =
  //       z.object({
  //         meta: z.object({
  //           nextVersion: z.string()
  //         }),
  //       })
  //       .parse(result[0])
      
  //     nextVersion = meta.nextVersion || 'latest'
  //     template = TEMPLATES.next
  //   } catch (error) {
  //     logger.break()
  //     handleError(error)
  //   }
  // }
  

  if (!options.force) {
    const {type, name} = await prompts([
      {
        type: options.template || isRemoteComponent ? null : "select",
        name: "type",
        message: `It's look like path ${highlighter.info(options.cwd)} does not contain package.json.\n
        Create a new project?`,
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

  // check if path is writable
  // const tempFile = path.join(options.cwd, `.temp-${Date.now()}.txt`);
  // try {
  //   await fs.writeFile(tempFile, 'test');
  //   await fs.unlink(tempFile);
  // } catch (error: any) {
  //   logger.break();
  //   logger.error(`The path ${highlighter.info(options.cwd)} is not writable.\n
  //   See error below, and if the issue persists, open the issue on the author's github (${highlighter.info(AUTHOR_REPO)})\n `);
  //   logger.error(
  //     `${highlighter.info(error.message)}`
  //   );
  //   logger.break();
  //   process.exit(1);
  // }

  const projectPath = path.resolve(options.cwd, projectName);

  // chekcing for the write permissions and if the directory exist or not
  try {
    fs.mkdirSync(projectPath);
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      let dirHandle;
      try {
        dirHandle = fs.opendirSync(projectPath);
        const entry = dirHandle.readSync();
        if (entry !== null) {
          console.error(`Directory ${projectName} already exists and is not empty.`);
          process.exit(1);
        }
      } catch (readDirError: any) {
        console.error(`Cannot read or check directory ${projectName}: ${readDirError.message}`);
        process.exit(1);
      } finally {
        if (dirHandle) {
          dirHandle.closeSync();
        }
      }
    } else {
      const msg = (error.code === 'EACCES' || error.code === 'EPERM')
        ? `Path ${options.cwd} is not writable.`
        : error.code === 'ENOENT'
        ? `Path ${options.cwd} does not exist.`
        : `Failed to create directory: ${error.message}`;

      console.error(msg);
      process.exit(1);
    }
  }

  // checkDirectory(cwd, projectName)

  
  const packageManager = await getPackageManager(options.cwd, {
    withFallBack: true,
  })


  if (template === TEMPLATES.next) {
    await createNextProject(projectPath, {
      version: nextVersion,
      cwd: options.cwd,
      packageManager,
      srcDir: options.srcDir,
    })
  }


  // Currently no support for monorepo
  // if (template === TEMPLATES["next-monorepo"]) {
  //   await createMonorepoProject(projectPath, {
  //     packageManager,
  //   })
  // }

  return {
    projectPath,
    projectName,
    template,
  }
}


export async function createNextProject(
  projectPath: string,
  options: {
    version: string
    cwd: string
    packageManager: string
    srcDir?: boolean
  }
) {
  const createSpinner = spinner("Creating Next.js project... (this may take time)").start();

  // Note: pnpm fails here. Fallback to npx with --use-PACKAGE-MANAGER.
  const args = [
    "--tailwind",
    "--eslint",
    "--typescript",
    "--app",
    options.srcDir ? "--src-dir" : "--no-src-dir",
    "--no-import-alias",
    `--use-${options.packageManager}`,
  ]

  if(
    options.version.startsWith("15") ||
    options.version.startsWith("latest") ||
    options.version.startsWith("canary")
  ) {
    args.push("--turbopack")
  }

  try {
    await execa(
      "npx",
      [`create-next-app@${options.version}`, projectPath, '--silent' ,...args],
      {
        cwd: options.cwd,
        stdio: "inherit",
      }
    )
  } catch (error: any) {
    logger.error(`Failed to create Next.js project. Please try again \n${error.message}`);
    process.exit(1);
  }

  createSpinner?.succeed("Creating a new Next.js project.")
}