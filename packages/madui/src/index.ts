#!/usr/bin/env node
import { add } from './commands/add';
import { Command } from 'commander';

import packageJson from '../package.json';

process.on("SIGINT", () => process.exit(0)); // Handle Ctrl+C
process.on("SIGTERM", () => process.exit(0)); // Handle kill command
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

async function main() {
  const program = new Command()
    .name("madui")
    .description("add madui components to your project")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "display the current version"
    )

    program
      .addCommand(add)

    program.parse(process.argv);
    
    if (!process.argv.slice(2).length) {
      program.outputHelp();  
    }

    program.showHelpAfterError('(Bro, dont hit to hard, just use -h or --help)');
}

main()

// export * from "./registry/api"