import { stat } from "fs/promises";

import { parse } from "@bomb.sh/args";
import inquirer from "inquirer";

import type { DeployConfig } from "./types.js";

/**
 * Displays help information for the CLI
 */
export function showHelp(): void {
  console.log(`
🚀 Cellar Static Deployer

Deploy static files to Clever Cloud Cellar (S3-compatible storage)

Usage:
  bun run index.ts [options]

Options:
  --access-key, -k    Cellar Access Key ID (or use CELLAR_ADDON_KEY_ID env var)
  --domain, -d        Domain (bucket name)
  --path, -p          Folder path to upload
  --workers, -w       Number of parallel upload workers (default: 16)
  --help, -h          Show this help message

Environment Variables:
  CELLAR_ADDON_KEY_ID      Cellar Access Key ID
  CELLAR_ADDON_KEY_SECRET  Cellar Secret Access Key

Examples:
  bun run index.ts
  bun run index.ts --domain example.com --path ./dist
  bun run index.ts -k ACCESS_KEY_ID -d example.com -p ./dist

If options are not provided, you will be prompted to enter them interactively.
`);
}

/**
 * Parses command line arguments
 * @param argv - Command line arguments array
 * @returns Parsed arguments object
 */
export function parseCliArgs(argv: string[]) {
  return parse(argv, {
    alias: {
      h: "help",
      k: "access-key",
      d: "domain",
      p: "path",
      w: "workers",
    },
    string: ["access-key", "k", "domain", "d", "path", "p", "workers", "w"],
    boolean: ["help", "h"],
    default: {
      "workers": "16",
    },
  });
}

/**
 * Prompts for missing credentials and configuration
 * @param args - Parsed CLI arguments
 * @returns Promise resolving to deployment configuration
 */
export async function promptForCredentials(args: any): Promise<DeployConfig> {
  const questions = [];

  // Check for Access Key ID from CLI, env var, or prompt
  const accessKeyId = args["access-key"] || process.env.CELLAR_ADDON_KEY_ID;
  if (!accessKeyId) {
    questions.push({
      type: "input",
      name: "accessKeyId",
      message: "🔑 Enter your Cellar Access Key ID:",
      validate: (input: string) => input.trim() !== "" || "Access Key ID is required",
    });
  }

  // Check for Secret Access Key from env var or prompt
  const secretAccessKey = process.env.CELLAR_ADDON_KEY_SECRET;
  if (!secretAccessKey) {
    questions.push({
      type: "password",
      name: "secretAccessKey",
      message: "🔐 Enter your Cellar Secret Access Key:",
      validate: (input: string) => input.trim() !== "" || "Secret Access Key is required",
    });
  }

  if (!args.domain) {
    questions.push({
      type: "input",
      name: "bucket",
      message: "🌐 Enter the domain (bucket name):",
      validate: (input: string) => input.trim() !== "" || "Domain is required",
    });
  }

  if (!args.path) {
    questions.push({
      type: "input",
      name: "folderPath",
      message: "📁 Enter the folder path to upload:",
      validate: async (input: string) => {
        if (input.trim() === "") return "Folder path is required";
        try {
          const stats = await stat(input);
          return stats.isDirectory() || "Path must be a directory";
        } catch {
          return "Directory does not exist";
        }
      },
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions as any) : {};

  return {
    accessKeyId: accessKeyId || answers.accessKeyId,
    secretAccessKey: secretAccessKey || answers.secretAccessKey,
    bucket: args.domain || answers.bucket,
    folderPath: args.path || answers.folderPath,
  };
}
