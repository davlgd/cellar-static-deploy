import { promises as dns } from "dns";

import type { DnsCheckResult } from "./types.js";
import { validateSubdomain, APEX_DOMAIN_ERROR, APEX_DOMAIN_DETAILS, CELLAR_HOSTNAME } from "./types.js";

/**
 * Checks if a domain has the correct CNAME record pointing to Cellar
 * @param domain - Domain to check
 * @returns Promise resolving to DNS check result
 */
export async function checkDnsCname(domain: string): Promise<DnsCheckResult> {
  try {
    console.log(`🔍 Checking DNS CNAME record for ${domain}…`);

    // Check if domain is APEX (no subdomain)
    const validation = validateSubdomain(domain);
    if (validation !== true) {
      console.log(`   ❌ APEX domain not supported`);
      return {
        success: false,
        domain,
        error: APEX_DOMAIN_ERROR,
        details: APEX_DOMAIN_DETAILS
      };
    }

    // First, try to resolve CNAME directly
    try {
      const cnameRecords = await dns.resolveCname(domain);
      if (cnameRecords && cnameRecords.length > 0) {
        const cnameTarget = cnameRecords[0];
        console.log(`   CNAME found: ${cnameTarget}`);

        // Check if the CNAME points to the correct Cellar endpoint
        const isCellarEndpoint = cnameTarget === CELLAR_HOSTNAME;

        if (isCellarEndpoint) {
          return {
            success: true,
            domain,
            cnameTarget,
            details: "CNAME record points to Cellar infrastructure"
          };
        } else {
          return {
            success: false,
            domain,
            cnameTarget,
            error: "CNAME does not point to correct Cellar endpoint"
          };
        }
      }
    } catch (cnameError) {
      // No CNAME record found, try A record
      console.log(`   No CNAME record found`);
    }

    // Try to resolve A record to see if domain resolves at all
    try {
      const aRecords = await dns.resolve4(domain);
      if (aRecords && aRecords.length > 0) {
        console.log(`   A record found: ${aRecords[0]}`);
        return {
          success: false,
          domain,
          error: "Domain has A record but no CNAME",
          details: `Domain resolves to IP ${aRecords[0]} but needs CNAME to Cellar`
        };
      }
    } catch (aError) {
      // No A record either
    }

    // Domain doesn't resolve at all
    return {
      success: false,
      domain,
      error: "Domain does not resolve",
      details: "No DNS records found for this domain"
    };

  } catch (error) {
    console.log(`   ❌ DNS check failed: ${error}`);
    return {
      success: false,
      domain,
      error: `DNS lookup failed: ${error}`,
      details: "Unable to perform DNS resolution"
    };
  }
}

/**
 * Displays DNS check results in a formatted way
 * @param result - DNS check result to display
 */
export function displayDnsResult(result: DnsCheckResult): void {
  console.log("\n📋 DNS Check Results:");

  if (result.success) {
    console.log(`   Status: ✅ Valid CNAME configuration`);
    if (result.cnameTarget) {
      console.log(`   Target: ${result.cnameTarget}`);
    }
  } else {
    console.log(`   Status: ❌ DNS configuration issue`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  if (result.details) {
    console.log(`   Details: ${result.details}`);
  }

  if (!result.success) {
    console.log("\n💡 To fix this issue:");
    console.log("   1. Create a CNAME record for your domain");
    console.log("   2. Point it to your Cellar bucket endpoint:");
    const hostname = result.domain.split('.')[0];
    console.log(`      ${hostname} IN CNAME ${CELLAR_HOSTNAME}.`);
  }
}
