import { S3Client } from "bun";

import { BATCH_DELETE_SIZE, CELLAR_ENDPOINT, type DeployConfig, calculateStats } from "./types.js";

/**
 * Displays manual bucket creation instructions
 * @param bucketName - Name of the bucket to create
 */
function showManualBucketInstructions(bucketName: string): void {
  console.log(`\n🔧 Manual Setup Required:`);
  console.log(`   Please create the bucket '${bucketName}' manually:`);
  console.log("   1. Go to https://console.clever-cloud.com/");
  console.log("   2. Navigate to your Cellar addon");
  console.log(`   3. Create a new bucket: ${bucketName}`);
  console.log("   4. Then run this tool again");
}

/**
 * Creates an S3Client instance configured for Cellar
 * @param config - Deployment configuration
 * @returns Configured S3Client instance
 */
export function createS3Client(config: DeployConfig): S3Client {
  return new S3Client({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    endpoint: CELLAR_ENDPOINT,
    acl: "public-read",
  });
}

/**
 * Ensures the specified bucket exists, creates it if it doesn't
 * @param client - S3Client instance
 * @param bucketName - Name of the bucket to check/create
 * @returns Promise resolving to true if bucket is accessible, false otherwise
 */
export async function ensureBucketExists(client: S3Client, bucketName: string): Promise<boolean> {
  process.stdout.write(`📦 Checking bucket '${bucketName}'… `);

  try {
    await client.list();
    console.log("✅ exists and accessible");
    return true;
  } catch (error: any) {
    if (error.name === "S3Error" && error.code === "NoSuchBucket") {
      console.log("❓ not found");
      process.stdout.write(`🔨 Creating bucket '${bucketName}'… `);
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

/**
 * Creates a new bucket using direct HTTP request
 * @param bucketName - Name of the bucket to create
 * @returns Promise resolving to true if creation succeeded, false otherwise
 */
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
      showManualBucketInstructions(bucketName);
      return false;
    }
  } catch (error) {
    console.log("❌ creation failed");
    console.error(`   Error: ${error}`);
    showManualBucketInstructions(bucketName);
    return false;
  }
}

/**
 * Clears all objects from the bucket in parallel batches
 * @param client - S3Client instance
 * @returns Promise that resolves when all objects are deleted
 */
export async function clearBucket(client: S3Client): Promise<void> {
  process.stdout.write("🧹 Clearing bucket… ");

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
          const { elapsed, rate } = calculateStats(startTime, totalDeleted);
          console.log(`\n✅ All objects deleted! Total: ${totalDeleted} files in ${elapsed}s (avg: ${rate}/s)`);
        }
        break;
      }

      const objectCount = objects.contents.length;
      batchCount++;

      if (batchCount === 1) {
        console.log(`found objects, starting deletion…`);
      }

      const deletePromises = objects.contents.map(async (obj) => {
        if (obj && obj.key) {
          await client.delete(obj.key);
          return true;
        }
        return false;
      });

      const deleteResults = await Promise.all(deletePromises);

      const deletedInThisBatch = deleteResults.filter(Boolean).length;
      totalDeleted += deletedInThisBatch;

      const { elapsed, rate } = calculateStats(startTime, totalDeleted);
      process.stdout.write(`\r🗑️  Deleting objects… ${totalDeleted} deleted (${elapsed}s at ${rate}/s) - batch ${batchCount}`);

      if (objectCount < BATCH_DELETE_SIZE) {
        const { elapsed: totalTime, rate: avgRate } = calculateStats(startTime, totalDeleted);
        console.log(`\n✅ All objects deleted! Total: ${totalDeleted} files in ${totalTime}s (avg: ${avgRate}/s)`);
        break;
      }

      console.log(`\n📦 Batch ${batchCount} complete, checking for more…`);
    }
  } catch (error) {
    console.log("\n❌ failed");
    console.error(`   Error: ${error}`);
    throw error;
  }
}
