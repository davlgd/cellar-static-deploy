# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-03

### Added
- DNS CNAME validation command (`check-dns`) to verify domain configuration
- Built-in DNS checker to validate CNAME records pointing to Cellar infrastructure
- Support for validating subdomain configuration before deployment
- Comprehensive DNS troubleshooting with specific error messages and fix instructions

### Improved
- Code refactoring and simplification without functional changes
- Centralized domain validation logic with reusable utility functions
- Unified error messages and constants for better consistency
- Reduced code duplication by 50+ lines through DRY principles
- Enhanced maintainability with modular architecture improvements

### Technical
- Added `validateSubdomain()` utility function for APEX domain validation
- Added `calculateStats()` utility function for progress tracking calculations
- Added constants for DNS error messages and Cellar hostname
- Centralized manual bucket creation instructions
- Improved code organization and reduced technical debt

## [0.1.0] - 2025-01-03

### Added
- Initial release of Cellar Static Deploy
- Interactive CLI prompts for credentials and configuration
- Support for environment variables (CELLAR_ADDON_KEY_ID, CELLAR_ADDON_KEY_SECRET)
- Command-line arguments support with short and long options
- Parallel file uploads with configurable worker count (default: 16)
- Batch deletion with parallel processing for efficient bucket clearing
- Automatic bucket creation with fallback to manual instructions
- Comprehensive error handling with specific error codes
- Real-time progress tracking for uploads and deletions
- Support for various file types with proper MIME type detection
- Modular code architecture with separation of concerns
- Built with Bun runtime and native S3 client
- Apache 2.0 license

### Features
- **Fast parallel uploads**: Up to 16 concurrent file uploads (configurable)
- **Smart bucket clearing**: Efficient batch processing with parallel operations
- **Secure credentials**: Environment variables and CLI support
- **Real-time progress**: Upload/deletion statistics with rates
- **Auto bucket creation**: Creates bucket if it doesn't exist
- **Error recovery**: Detailed error messages and recovery instructions

### Technical Details
- Bun runtime with native S3 client
- Modular TypeScript architecture:
  - `src/types.ts` - Interfaces and constants
  - `src/cli.ts` - CLI handling and prompts
  - `src/s3-client.ts` - S3 operations
  - `src/file-utils.ts` - File operations
- Dependencies: inquirer, @bomb.sh/args
- Supports Clever Cloud Cellar (S3-compatible storage)
