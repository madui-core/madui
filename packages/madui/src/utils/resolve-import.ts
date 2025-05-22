import { createMatchPath, type ConfigLoaderSuccessResult } from "tsconfig-paths"

export async function resolveImport(importPath: string, tsConfig: Pick<ConfigLoaderSuccessResult, "absoluteBaseUrl" | "paths">) {
  return createMatchPath(tsConfig.absoluteBaseUrl, tsConfig.paths)
  (
    importPath,
    undefined,
    () => true,
    ['.ts', '.tsx']
  ) 
}