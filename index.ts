#!/usr/bin/env bun
import { S3Client } from "bun";
import inquirer from "inquirer";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { parse } from "@bomb.sh/args";

const CELLAR_ENDPOINT = "https://cellar-c2.services.clever-cloud.com";
const BATCH_DELETE_SIZE = 1000;

interface DeployConfig {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  folderPath: string;
}

function showHelp() {
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

async function promptForCredentials(args: any): Promise<DeployConfig> {
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


async function ensureBucketExists(client: S3Client, bucketName: string): Promise<boolean> {
  process.stdout.write(`📦 Checking bucket '${bucketName}'... `);

  try {
    await client.list();
    console.log("✅ exists and accessible");
    return true;
  } catch (error: any) {
    if (error.name === "S3Error" && error.code === "NoSuchBucket") {
      console.log("❓ not found");
      process.stdout.write(`🔨 Creating bucket '${bucketName}'... `);
      const created = await createBucket(bucketName);
      if (created) {
        console.log("✅ created successfully");
      }
      return created;
    } else if (error.name === "S3Error" && error.code === "InvalidAccessKeyId") {
      console.log("❌ invalid access key");
      console.error("   Please check your access key credentials.");
      return false;
    } else if (error.name === "S3Error" && error.code === "SignatureDoesNotMatch") {
      console.log("❌ invalid secret key");
      console.error("   Please check your secret key credentials.");
      return false;
    } else {
      console.log("❌ access failed");
      console.error(`   Error: ${error.message || error}`);
      console.log("   This could be due to:");
      console.log("   • Invalid credentials");
      console.log("   • Network connectivity issues");
      console.log("   • Bucket access permissions");
      return false;
    }
  }
}

async function createBucket(bucketName: string): Promise<boolean> {
  try {
    const response = await fetch(`${CELLAR_ENDPOINT}/${bucketName}`, {
      method: "PUT",
      headers: {
        "Content-Length": "0",
      },
    });

    if (response.ok || response.status === 200 || response.status === 409) {
      return true;
    } else {
      console.log("❌ creation failed");
      console.error(`   Status: ${response.status} ${response.statusText}`);

      console.log(`\n🔧 Manual Setup Required:`);
      console.log(`   Please create the bucket '${bucketName}' manually:`);
      console.log("   1. Go to https://console.clever-cloud.com/");
      console.log("   2. Navigate to your Cellar addon");
      console.log(`   3. Create a new bucket: ${bucketName}`);
      console.log("   4. Then run this tool again");
      return false;
    }
  } catch (error) {
    console.log("❌ creation failed");
    console.error(`   Error: ${error}`);
    console.log(`\n🔧 Manual Setup Required:`);
    console.log(`   Please create the bucket '${bucketName}' manually:`);
    console.log("   1. Go to https://console.clever-cloud.com/");
    console.log("   2. Navigate to your Cellar addon");
    console.log(`   3. Create a new bucket: ${bucketName}`);
    console.log("   4. Then run this tool again");
    return false;
  }
}

async function clearBucket(client: S3Client): Promise<void> {
  process.stdout.write("🧹 Clearing bucket... ");

  try {
    let totalDeleted = 0;
    let batchCount = 0;
    const startTime = Date.now();

    while (true) {
      const objects = await client.list({ maxKeys: BATCH_DELETE_SIZE });

      if (!objects.contents || objects.contents.length === 0) {
        if (totalDeleted === 0) {
          console.log("✅ already empty");
        } else {
          const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
          const avgRate = (totalDeleted / (Date.now() - startTime) * 1000).toFixed(1);
          console.log(`\n✅ All objects deleted! Total: ${totalDeleted} files in ${totalTime}s (avg: ${avgRate}/s)`);
        }
        break;
      }

      const objectCount = objects.contents.length;
      batchCount++;

      if (batchCount === 1) {
        console.log(`found objects, starting deletion...`);
      }

      // Paralléliser les suppressions dans ce batch
      const deletePromises = objects.contents.map(async (obj) => {
        if (obj && obj.key) {
          await client.delete(obj.key);
          return true; // Suppression réussie
        }
        return false;
      });

      // Attendre que toutes les suppressions du batch soient terminées
      const deleteResults = await Promise.all(deletePromises);

      // Compter les suppressions réussies
      const deletedInThisBatch = deleteResults.filter(Boolean).length;
      totalDeleted += deletedInThisBatch;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalDeleted / (Date.now() - startTime) * 1000).toFixed(1);
      process.stdout.write(`\r🗑️  Deleting objects... ${totalDeleted} deleted (${elapsed}s at ${rate}/s) - batch ${batchCount}`);

      // Si on a récupéré moins de BATCH_DELETE_SIZE objets, c'est qu'on a fini
      if (objectCount < BATCH_DELETE_SIZE) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const avgRate = (totalDeleted / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`\n✅ All objects deleted! Total: ${totalDeleted} files in ${totalTime}s (avg: ${avgRate}/s)`);
        break;
      }

      // Sinon on continue avec le batch suivant
      console.log(`\n📦 Batch ${batchCount} complete, checking for more...`);
    }
  } catch (error) {
    console.log("\n❌ failed");
    console.error(`   Error: ${error}`);
    throw error;
  }
}

async function getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

async function uploadFile(client: S3Client, filePath: string, folderPath: string): Promise<void> {
  const file = Bun.file(filePath);
  const relativePath = filePath.replace(folderPath, "").replace(/^\//, "");

  const s3File = client.file(relativePath);
  await s3File.write(file, {
    type: file.type || getContentType(relativePath),
  });
}

async function uploadFolder(client: S3Client, folderPath: string, workers: number = 16): Promise<void> {
  process.stdout.write("📂 Scanning folder... ");

  try {
    const files = await getAllFiles(folderPath);
    console.log(`found ${files.length} files`);

    let uploaded = 0;
    let failed = 0;
    const startTime = Date.now();
    const progressLock = { current: "" };

    // Fonction pour mettre à jour le progress de manière thread-safe
    const updateProgress = () => {
      uploaded++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (uploaded / (Date.now() - startTime) * 1000).toFixed(1);
      const percentage = ((uploaded / files.length) * 100).toFixed(1);
      progressLock.current = `\r📤 Uploading... ${uploaded}/${files.length} (${percentage}%) - ${elapsed}s at ${rate}/s`;
      process.stdout.write(progressLock.current);
    };

    // Upload en parallèle avec pool de workers
    const uploadPromises = [];
    let fileIndex = 0;

    const processFile = async (): Promise<void> => {
      while (fileIndex < files.length) {
        const currentIndex = fileIndex++;
        const filePath = files[currentIndex];

        if (!filePath) continue;

        try {
          await uploadFile(client, filePath, folderPath);
          updateProgress();
        } catch (error) {
          failed++;
          console.error(`\n❌ Failed to upload ${filePath}: ${error}`);
        }
      }
    };

    // Démarrer tous les workers
    for (let i = 0; i < workers; i++) {
      uploadPromises.push(processFile());
    }

    // Attendre que tous les workers terminent
    await Promise.all(uploadPromises);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (uploaded / (Date.now() - startTime) * 1000).toFixed(1);

    if (failed > 0) {
      console.log(`\n⚠️  Upload completed with errors! ${uploaded} successful, ${failed} failed in ${totalTime}s (${rate}/s)`);
    } else {
      console.log(`\n✅ Upload complete! ${files.length} files in ${totalTime}s (${rate}/s)`);
    }
  } catch (error) {
    console.log("\n❌ Upload failed");
    console.error(`   Error: ${error}`);
    throw error;
  }
}

async function main() {
  try {
    const args = parse(process.argv, {
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

    if (args.help) {
      showHelp();
      return;
    }

    console.log("🚀 Cellar Static Deployer");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const config = await promptForCredentials(args);

    const workers = parseInt(String(args.workers || "16"), 10);

    console.log("📋 Configuration:");
    console.log(`   Workers: ${workers}`);
    console.log(`   Domain: ${config.bucket}`);
    console.log(`   Endpoint: ${CELLAR_ENDPOINT}`);
    console.log(`   Folder: ${config.folderPath}\n`);

    const client = new S3Client({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      bucket: config.bucket,
      endpoint: CELLAR_ENDPOINT,
      acl: "public-read", // Rendre les fichiers publics
    });

    const bucketExists = await ensureBucketExists(client, config.bucket);

    if (!bucketExists) {
      console.log("\n❌ Deployment aborted - bucket setup required");
      process.exit(1);
    }

    console.log("");
    await clearBucket(client);
    console.log(""); // Ligne vide après la suppression
    await uploadFolder(client, config.folderPath, workers);

    console.log("\n🎉 Deployment completed successfully!");
    console.log(`📍 Your site should be available at: https://${config.bucket}`);
  } catch (error) {
    console.log("\n💥 Deployment failed");
    console.error(`   Error: ${error}`);
    process.exit(1);
  }
}

main();