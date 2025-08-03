/**
 * Clever Cloud Cellar S3-compatible endpoint URL
 */
export const CELLAR_ENDPOINT = "https://cellar-c2.services.clever-cloud.com";

/**
 * Maximum number of objects to delete in a single batch operation
 */
export const BATCH_DELETE_SIZE = 1000;

/**
 * Configuration object for deployment
 */
export interface DeployConfig {
  /** Cellar access key ID */
  accessKeyId: string;
  /** Cellar secret access key */
  secretAccessKey: string;
  /** Target bucket name (domain) */
  bucket: string;
  /** Local folder path to upload */
  folderPath: string;
}

/**
 * DNS check result interface
 */
export interface DnsCheckResult {
  /** Whether the DNS check was successful */
  success: boolean;
  /** Domain that was checked */
  domain: string;
  /** CNAME target found (if any) */
  cnameTarget?: string;
  /** Error message if check failed */
  error?: string;
  /** Additional details about the DNS resolution */
  details?: string;
}
