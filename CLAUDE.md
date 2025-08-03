# Cellar Static Deploy - Project Documentation

## Project Overview

This is a CLI tool for deploying static websites to Clever Cloud Cellar (S3-compatible storage). The project uses Bun runtime exclusively and follows a modular TypeScript architecture.

## Architecture

### Modular Structure

```
├── index.ts              # Main entry point
├── src/
│   ├── types.ts          # Types, interfaces, and constants
│   ├── cli.ts            # CLI argument parsing and prompts
│   ├── s3-client.ts      # S3/Cellar operations
│   └── file-utils.ts     # File system and upload utilities
├── package.json          # NPM package configuration
├── CHANGELOG.md          # Version history
└── README.md            # User documentation
```

### Key Components

1. **CLI Module** (`src/cli.ts`)
   - Interactive prompts using `inquirer`
   - Argument parsing with `@bomb.sh/args`
   - Environment variable support

2. **S3 Client Module** (`src/s3-client.ts`)
   - Bucket management (creation, verification)
   - Parallel batch deletion
   - Error handling with specific S3 error codes

3. **File Utils Module** (`src/file-utils.ts`)
   - Recursive directory scanning
   - MIME type detection
   - Parallel file uploads with worker pools

4. **Types Module** (`src/types.ts`)
   - Shared interfaces and constants
   - Configuration types
   - API endpoints

## Bun Usage Guidelines

- Use `bun run index.ts` to execute the application
- Use `bun install` for dependency management
- Use `bun test` for testing (when tests are added)
- Leverage Bun's native S3Client instead of AWS SDK
- Use `Bun.file()` for file operations

## Development Workflow

### Running the Tool

```bash
# Interactive mode
bun run index.ts

# With CLI arguments
bun run index.ts --domain example.com --path ./dist

# Show help
bun run index.ts --help
```

### Key Features

- **Parallel Processing**: Upload and deletion operations use configurable worker pools
- **Progress Tracking**: Real-time progress with rates and statistics
- **Error Recovery**: Comprehensive error handling with user guidance
- **Environment Support**: Automatic detection of Cellar environment variables
- **Type Safety**: Full TypeScript with JSDoc documentation

### Dependencies

- `@bomb.sh/args`: CLI argument parsing
- `inquirer`: Interactive prompts
- `@types/inquirer`: TypeScript definitions

### Code Quality

- All functions have JSDoc documentation
- Imports are organized alphabetically
- English-only comments and messages
- Proper ellipsis characters (…) in user messages
- Consistent error handling patterns

## Release Process

Current version: 0.1.0

- Version management in `package.json`
- Changelog maintenance in `CHANGELOG.md`
- Apache 2.0 license
- GitHub repository: `https://github.com/davlgd/cellar-static-deploy`
