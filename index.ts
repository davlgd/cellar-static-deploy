#!/usr/bin/env bun
import { parseCliArgs, promptForCredentials, showHelp } from "./src/cli.js";
import { uploadFolder } from "./src/file-utils.js";
import { clearBucket, createS3Client, ensureBucketExists } from "./src/s3-client.js";
import { CELLAR_ENDPOINT } from "./src/types.js";

/**
 * Main function that orchestrates the deployment process
 */
async function main() {
  try {
    const args = parseCliArgs(process.argv);

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

    const client = createS3Client(config);

    const bucketExists = await ensureBucketExists(client, config.bucket);

    if (!bucketExists) {
      console.log("\n❌ Deployment aborted - bucket setup required");
      process.exit(1);
    }

    console.log("");
    await clearBucket(client);
    console.log("");
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
