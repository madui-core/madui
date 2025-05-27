import { initOptionsSchema } from '@/commands/init';
import os from 'os';
import { z } from 'zod';

export const TEMPLATES = {
  next: "next",
  "next-monorepo": "next-monorepo",
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

  

}