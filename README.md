# Cellar Static Deploy

A fast, simple tool to deploy static websites to [Clever Cloud Cellar](https://www.clever-cloud.com/developers/doc/addons/cellar/), the S3-compatible object storage service.

## Features

- 🚀 **Fast parallel uploads** with configurable workers (default: 16)
- 🧹 **Smart bucket clearing** with batch processing
- 🔐 **Secure credentials** via environment variables or CLI
- 📊 **Real-time progress** with upload/deletion statistics
- ⚡ **Powered by Bun** with native S3 client

## Prerequisites

- [Bun](https://bun.sh) runtime
- A [Clever Cloud Cellar](https://www.clever-cloud.com/developers/doc/addons/cellar/) add-on
- Your website entrypoints must be `index.html` files (`/blog/index.html`, not `/blog/` for example)

## Installation

### Via package manager

```bash
# Install globally
bun install -g cellar-static-deploy

# Use without installing
bunx cellar-static-deploy
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
# or
bunx cellar-static-deploy [options]

Options:
  --access-key, -k    Cellar Access Key ID
  --domain, -d        Domain (bucket name)
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
```

## How it Works

1. **Validates credentials** and checks bucket access
2. **Creates bucket** if it doesn't exist
3. **Clears bucket** by deleting all existing files in batches
4. **Uploads files** in parallel with configurable workers
5. **Sets public ACL** for web hosting

## Clever Cloud Integration

### Cellar Setup

Create a Cellar add-on in the [Clever Cloud Console](https://console.clever-cloud.com) or with [Clever Tools](https://www.clever-cloud.com/developers/doc/cli/), Clever Cloud's CLI:

```bash
clever addon create cellar-addon myCellar
```

Then, from the [Clever Cloud Console](https://console.clever-cloud.com):

1. Get your credentials from the add-on dashboard
2. Create a bucket with your domain name

To access the website,add a `CNAME` DNS record for your domain pointing to `cellar-c2.services.clever-cloud.com`

### Bun Support

This tool is built with [Bun](https://bun.sh), which is [natively supported by Clever Cloud](https://www.clever-cloud.com/developers/doc/applications/nodejs/). You can deploy Bun applications directly on Clever Cloud and use this script in [Clever Tasks](https://www.clever-cloud.com/developers/doc/develop/tasks/), with a Cellar add-on linked to the application for automatic credentials configuration.

## Performance

- **Parallel uploads**: Up to 16 concurrent file uploads (configurable)
- **Batch deletion**: Efficient bucket clearing with parallel operations
- **Native S3 client**: Leverages Bun's optimized S3 implementation
- **Real-time stats**: Progress tracking with upload/deletion rates

## Links

- [Clever Cloud Console](https://console.clever-cloud.com)
- [Cellar Documentation](https://www.clever-cloud.com/developers/doc/addons/cellar/)
- [Bun on Clever Cloud](https://www.clever-cloud.com/developers/doc/applications/nodejs/)

## License

See [LICENSE](LICENSE) file for details.

---

Made with ❤️ and ⚡ for the Open Source Community
