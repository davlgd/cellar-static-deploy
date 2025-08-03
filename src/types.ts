/**
 * Clever Cloud Cellar S3-compatible endpoint URL
 */
export const CELLAR_ENDPOINT = "https://cellar-c2.services.clever-cloud.com";

/**
 * Clever Cloud Cellar hostname (without protocol)
 */
export const CELLAR_HOSTNAME = "cellar-c2.services.clever-cloud.com";

/**
 * Maximum number of objects to delete in a single batch operation
 */
export const BATCH_DELETE_SIZE = 1000;

/**
 * APEX domain validation messages
 */
export const APEX_DOMAIN_ERROR = "APEX domains are not supported";
export const APEX_DOMAIN_DETAILS = "Use a subdomain (e.g., www.example.com).";

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

/**
 * Validates that a domain is not an APEX domain
 * @param domain - Domain to validate
 * @returns True if valid (is a subdomain), string error message if invalid
 */
export function validateSubdomain(domain: string): true | string {
  if (domain.trim() === "") return "Domain is required";
  const domainParts = domain.split('.');
  if (domainParts.length <= 2) {
    return `${APEX_DOMAIN_ERROR}. ${APEX_DOMAIN_DETAILS}`;
  }
  return true;
}

/**
 * Calculates elapsed time and rate for progress tracking
 * @param startTime - Start time in milliseconds
 * @param count - Number of items processed
 * @returns Object with elapsed time and rate
 */
export function calculateStats(startTime: number, count: number) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (count / (Date.now() - startTime) * 1000).toFixed(1);
  return { elapsed, rate };
}
