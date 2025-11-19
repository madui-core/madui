import { NextRequest } from "next/server"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import { spawn } from "child_process"

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json()
        const { name, content, registryType } = body

        // Validate inputs
        if (!name || !content || !registryType) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: "Missing required fields: name, content, or registryType",
              }) + "\n"
            )
          )
          controller.close()
          return
        }

        // Extract type from registry type (remove "registry:" prefix)
        const type = registryType.replace("registry:", "")

        // Define paths
        const registryDir = join(
          process.cwd(),
          "registry",
          "new-york-v4",
          type
        )
        const componentPath = join(registryDir, `${name}.tsx`)
        const registryFilePath = join(
          process.cwd(),
          "registry",
          `registry-${type}.ts`
        )

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "log",
              message: `Writing component to ${componentPath}...`,
            }) + "\n"
          )
        )

        // Write the component file
        await writeFile(componentPath, content, "utf-8")

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "log",
              message: `Component file created successfully`,
            }) + "\n"
          )
        )

        // Read the current registry file
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "log",
              message: `Updating registry file ${registryFilePath}...`,
            }) + "\n"
          )
        )

        const registryContent = await readFile(registryFilePath, "utf-8")

        // Create the new registry entry
        const newEntry = `  {
    name: "${name}",
    type: "${registryType}",
    files: [
      {
        path: "${type}/${name}.tsx",
        type: "${registryType}",
      },
    ],
  },`

        // Find the position to insert the new entry (after the opening bracket of the array)
        const arrayStartPattern = /export const \w+: Registry\["items"\] = \[/
        const match = registryContent.match(arrayStartPattern)

        if (!match) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: "Could not find registry array in file",
              }) + "\n"
            )
          )
          controller.close()
          return
        }

        const insertPosition = match.index! + match[0].length
        const updatedContent =
          registryContent.slice(0, insertPosition) +
          "\n" +
          newEntry +
          registryContent.slice(insertPosition)

        // Write the updated registry file
        await writeFile(registryFilePath, updatedContent, "utf-8")

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "log",
              message: `Registry file updated successfully`,
            }) + "\n"
          )
        )

        // Run pnpm registry:build
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "log",
              message: `Running pnpm registry:build...`,
            }) + "\n"
          )
        )

        const buildProcess = spawn("pnpm", ["registry:build"], {
          cwd: process.cwd(),
          shell: true,
        })

        buildProcess.stdout.on("data", (data) => {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "stdout",
                message: data.toString(),
              }) + "\n"
            )
          )
        })

        buildProcess.stderr.on("data", (data) => {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "stderr",
                message: data.toString(),
              }) + "\n"
            )
          )
        })

        buildProcess.on("close", (code) => {
          if (code === 0) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "success",
                  message: "Component added successfully and registry built!",
                }) + "\n"
              )
            )
          } else {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  message: `Build process exited with code ${code}`,
                }) + "\n"
              )
            )
          }
          controller.close()
        })

        buildProcess.on("error", (error) => {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: `Failed to start build process: ${error.message}`,
              }) + "\n"
            )
          )
          controller.close()
        })
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: `Error: ${error.message}`,
            }) + "\n"
          )
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
