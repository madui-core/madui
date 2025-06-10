import { detect } from '@antfu/ni'

// Cache for detection results to avoid redundant calls
const detectionCache = new Map<string, string | undefined>()

enum PackageManager {
  Yarn = "yarn",
  Pnpm = "pnpm",
  Bun = "bun",
  Npm = "npm",
  Deno = "deno",
}

const ALIAS_MAP: Record<string, PackageManager> = {
  "yarn@berry": PackageManager.Yarn,
  "pnpm@6": PackageManager.Pnpm,
};

export async function getPackageManager(
  cwd: string,
  {withFallBack}: {withFallBack?: boolean} = {withFallBack: false,}
): Promise<"yarn" | "pnpm" | "bun" | "npm" | "deno"> {
  let packageManager = detectionCache.get(cwd);

  if(!packageManager) {
    packageManager = await detect({programmatic: true, cwd: cwd,})
    detectionCache.set(cwd, packageManager)
  }

  // Return mapped alias or detected package manager
  if (packageManager && packageManager in ALIAS_MAP) {
    return ALIAS_MAP[packageManager] as PackageManager;
  }

  if(packageManager && Object.values(PackageManager).includes(packageManager as PackageManager)) {
    return packageManager as PackageManager;
  }

  if(!withFallBack) {
    return "npm"
  }


  // Fallback to user agent if no package manager is detected
  const userAgent = process.env.npm_config_user_agent || ""

  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("bun")) return "bun";
  if (userAgent.startsWith("deno")) return "deno";

  return "bun";
}

const RUNNER_MAP: Record<string, string> = {
  [PackageManager.Pnpm]: "pnpm dlx",
  [PackageManager.Bun]: "bunx",
};

export async function getPackageRunner(cwd: string) : Promise<string> {
  const packageManger = await getPackageManager(cwd);
  return RUNNER_MAP[packageManger] || "npx";
}