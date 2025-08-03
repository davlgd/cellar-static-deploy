# Cellar Static Deploy

A fast, simple tool to deploy static websites to [Clever Cloud Cellar](https://www.clever-cloud.com/developers/doc/addons/cellar/), the S3-compatible object storage service.

## Features

- 🚀 **Fast parallel uploads** with configurable workers (default: 16)
- 🧹 **Smart bucket clearing** with batch processing
- 🔐 **Secure credentials** via environment variables or CLI
- 📊 **Real-time progress** with upload/deletion statistics
- 🔍 **DNS validation** with built-in CNAME checker
- ⚡ **Powered by Bun** with native S3 client

## Prerequisites

- [Bun](https://bun.sh) runtime
- A [Clever Cloud Cellar](https://www.clever-cloud.com/developers/doc/addons/cellar/) add-on
- Your website entry points must be `index.html` files (`/blog/index.html`, not `/blog/` for example)

## Installation

### Via package manager

```bash
# Install globally
bun install -g cellar-static-deploy

# Use without installing
bunx cellar-static-deploy
```

### Pre-compiled binaries

Download the latest release for your platform from [GitHub Releases](https://github.com/davlgd/cellar-static-deploy/releases):

- **macOS ARM64**: `cellar-static-deploy-darwin-arm64`
- **Linux ARM64**: `cellar-static-deploy-linux-arm64`
- **Linux x64**: `cellar-static-deploy-linux-x64`
- **Windows x64**: `cellar-static-deploy-windows-x64.exe`

```bash
# Make executable (Linux/macOS)
chmod +x cellar-static-deploy-*

# Run directly, for example on macOS ARM64
./cellar-static-deploy-darwin-arm64 --help
```

### From source

```bash
git clone https://github.com/davlgd/cellar-static-deploy.git
cd cellar-static-deploy
bun install
```

## Usage

### Quick Start

```bash
# If installed globally
cellar-static-deploy

# If using bunx
bunx cellar-static-deploy

# From source
bun run index.ts
```

The tool will prompt you for:
- Cellar Access Key ID
- Cellar Secret Access Key
- Domain (bucket name)
- Folder path to upload

### CLI Options

```bash
cellar-static-deploy [options]
cellar-static-deploy check-dns --domain <domain>
# or
bunx cellar-static-deploy [options]
bunx cellar-static-deploy check-dns -d <domain>

Commands:
  check-dns           Check DNS CNAME configuration for domain

Options:
  --access-key, -k    Cellar Access Key ID
  --domain, -d        Domain (bucket name, can't be an APEX domain)
  --path, -p          Folder path to upload
  --workers, -w       Number of parallel upload workers (default: 16)
  --help, -h          Show help message
```

### Environment Variables

You can use environment variables for credentials:

```bash
export CELLAR_ADDON_KEY_ID="your_access_key_id"
export CELLAR_ADDON_KEY_SECRET="your_secret_access_key"
cellar-static-deploy -d example.com -p ./dist
```

### Examples

```bash
# Interactive mode
bunx cellar-static-deploy

# CLI with credentials
cellar-static-deploy -k ACCESS_KEY_ID -d example.com -p ./dist

# Environment variables + CLI
export CELLAR_ADDON_KEY_ID="key_id"
export CELLAR_ADDON_KEY_SECRET="secret_key"
bunx cellar-static-deploy -d example.com -p ./dist -w 8

# Check DNS configuration
bunx cellar-static-deploy check-dns -d www.example.com
```

## How it Works

1. **Validates credentials** and checks bucket access using Bun's native S3Client
2. **Creates bucket** if it doesn't exist with fallback to manual instructions
3. **Clears bucket** by deleting all existing files in parallel batches (1000 objects per batch)
4. **Uploads files** in parallel with configurable worker pools (default: 16 workers)
5. **Sets public ACL** for web hosting with proper MIME type detection

## DNS Configuration

### Check DNS Setup

Before deploying, you can verify your DNS configuration using the built-in DNS checker:

```bash
bunx cellar-static-deploy check-dns -d www.example.com
```

This command will:
- ✅ Verify your domain has a proper CNAME record pointing to `cellar-c2.services.clever-cloud.com`
- ❌ Detect common DNS misconfigurations
- 💡 Provide specific instructions to fix DNS issues

> [!NOTE]
> APEX domains (e.g., `example.com`) are not supported. Use a subdomain like `www.example.com`.

## Clever Cloud Integration

### Cellar Setup

Create a Cellar add-on in the [Clever Cloud Console](https://console.clever-cloud.com) or with [Clever Tools](https://www.clever-cloud.com/developers/doc/cli/), Clever Cloud's CLI:

```bash
clever addon create cellar-addon myCellar
```

Then, from the [Clever Cloud Console](https://console.clever-cloud.com):

1. Get your credentials from the add-on dashboard
2. Create a bucket with your domain name

### Bun Support

This tool is built with [Bun](https://bun.sh), which is [natively supported by Clever Cloud](https://www.clever-cloud.com/developers/doc/applications/nodejs/). You can deploy Bun applications directly on Clever Cloud and use this script in [Clever Tasks](https://www.clever-cloud.com/developers/doc/develop/tasks/), with a Cellar add-on linked to the application for automatic credentials configuration.

## Performance

- **Parallel uploads**: Up to 16 concurrent file uploads (configurable with `--workers`)
- **Batch deletion**: Efficient bucket clearing with parallel operations (1000 objects per batch)
- **Native S3 client**: Leverages Bun's optimized S3 implementation instead of AWS SDK
- **Real-time stats**: Progress tracking with upload/deletion rates and elapsed time
- **MIME detection**: Automatic content-type detection for proper web serving

## Contributing

Contributions are welcome!

- **Issues**: [GitHub Issues](https://github.com/davlgd/cellar-static-deploy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/davlgd/cellar-static-deploy/discussions)

### Development Setup

1. Install [Bun](https://bun.sh)
2. Clone the repository
3. Run `bun install` to install dependencies
4. Make your changes following the existing code style
5. Test with `bun run index.ts --help`

## Project structure

This tool follows a modular TypeScript architecture:

```
├── index.ts              # Main entry point and orchestration
└── src/
    ├── types.ts          # Shared types, interfaces, and constants
    ├── cli.ts            # CLI argument parsing and interactive prompts
    ├── s3-client.ts      # S3/Cellar operations (bucket management, deletion)
    ├── file-utils.ts     # File system operations and uploads
    └── dns-utils.ts      # DNS validation and CNAME checking
```

## License

Apache License 2.0 - See [LICENSE](LICENSE) file for details.

---

Made with ❤️ and ⚡ for the Open Source Community
