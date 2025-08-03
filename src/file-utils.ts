import { S3Client } from "bun";
import { readdir, stat } from "fs/promises";
import { join } from "path";

/**
 * Recursively gets all files from a directory
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths (defaults to dir)
 * @returns Promise resolving to array of file paths
 */
export async function getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
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

/**
 * Determines the MIME type based on file extension
 * @param filename - Name of the file
 * @returns MIME type string
 */
export function getContentType(filename: string): string {
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

/**
 * Uploads a single file to S3
 * @param client - S3Client instance
 * @param filePath - Absolute path to the file
 * @param folderPath - Base folder path to calculate relative path
 * @returns Promise that resolves when upload completes
 */
async function uploadFile(client: S3Client, filePath: string, folderPath: string): Promise<void> {
  const file = Bun.file(filePath);
  const relativePath = filePath.replace(folderPath, "").replace(/^\//, "");

  const s3File = client.file(relativePath);
  await s3File.write(file, {
    type: file.type || getContentType(relativePath),
  });
}

/**
 * Uploads all files from a folder to S3 using parallel workers
 * @param client - S3Client instance
 * @param folderPath - Path to the folder to upload
 * @param workers - Number of parallel upload workers (default: 16)
 * @returns Promise that resolves when all uploads complete
 */
export async function uploadFolder(client: S3Client, folderPath: string, workers: number = 16): Promise<void> {
  process.stdout.write("📂 Scanning folder… ");

  try {
    const files = await getAllFiles(folderPath);
    console.log(`found ${files.length} files`);

    let uploaded = 0;
    let failed = 0;
    const startTime = Date.now();

    const updateProgress = () => {
      uploaded++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (uploaded / (Date.now() - startTime) * 1000).toFixed(1);
      const percentage = ((uploaded / files.length) * 100).toFixed(1);
      process.stdout.write(`\r📤 Uploading… ${uploaded}/${files.length} (${percentage}%) - ${elapsed}s at ${rate}/s`);
    };

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

    for (let i = 0; i < workers; i++) {
      uploadPromises.push(processFile());
    }

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
