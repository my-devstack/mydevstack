# MyDevStack

A modern, developer-friendly Docker image for managing AWS services running locally via AWS emulators like LocalStack or MiniStack.

![Docker](https://img.shields.io/badge/Docker-24.0+-2496ED?style=flat&logo=docker)
![Multi-platform](https://img.shields.io/badge/Platforms-linux_darwin_windows-FF6B6B?style=flat)
![License](https://img.shields.io/badge/License-MIT-ea580c)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/beabys)

## Architecture

This repository builds a unified Docker image that combines:

- **Frontend**: Vue 3 + TypeScript web interface (in `pkg/ui`)
- **Backend**: Go REST API proxy (in `pkg/proxy`)

## Project Structure

```
mydevstack/
├── .github/                 # GitHub workflows
├── pkg/
│   ├── proxy/              # Go backend API proxy
│   │   ├── cmd/           # Entry points
│   │   ├── internal/       # Business logic
│   │   └── bootstrap/      # DI setup
│   └── ui/                 # Vue 3 frontend
│       ├── src/            # Vue source code
│       └── package.json    # Dependencies
├── docker-compose.yml       # Docker Compose for LocalStack
├── docker-compose-floci.yml # Docker Compose for FloCi
├── docker-compose-ministack.yml # Docker Compose for MiniStack
├── Dockerfile              # Multi-platform Docker image
└── nginx.conf             # Nginx configuration
```

## Features

- **All-in-one image**: Frontend and backend in a single container
- **Multi-platform support**: Linux (amd64, arm64), Darwin (amd64, arm64), Windows
- **Easy deployment**: Simple docker-compose setup
- **Configurable**: Environment variables for all settings

## Quick Start

### Using Docker Compose

#### With LocalStack

```bash
docker-compose up -d
```

Or use a specific docker-compose file:

| Emulator | Command |
|----------|---------|
| LocalStack | `docker-compose up -d` |
| FloCi | `docker-compose -f docker-compose-floci.yml up -d` |
| MiniStack | `docker-compose -f docker-compose-ministack.yml up -d` |

Then access the UI at [http://localhost:3000](http://localhost:3000)

#### With FloCi

```bash
docker-compose -f docker-compose-floci.yml up -d
```

#### With MiniStack

```bash
docker-compose -f docker-compose-ministack.yml up -d
```

### Using Docker Compose (custom)

```yaml
services:
  mydevstack:
    image: beabys/mydevstack:latest
    ports:
      - "3000:3000"
    environment:
      - AWS_ENDPOINT=http://localstack:4566
      - AWS_REGION=us-east-1
    restart: unless-stopped

  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,lambda,dynamodb,sqs,sns,iam,kms
```

```bash
docker-compose up -d
```

### Using Docker Directly

```bash
docker run -d \
  -p 3000:3000 \
  -e AWS_ENDPOINT=http://localhost:4566 \
  -e AWS_REGION=us-east-1 \
  beabys/mydevstack:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Frontend HTTP port |
| `PROXY_PORT` | `8081` | Backend proxy port |
| `AWS_ENDPOINT` | `http://localhost:4566` | AWS emulator endpoint URL |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | `test` | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | `test` | AWS secret access key |

### Frontend Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_AWS_ENDPOINT` | `http://localhost:8081` | Proxy endpoint (used at build time) |
| `VITE_AWS_REGION` | `us-east-1` | AWS region (used at build time) |

**Note**: The frontend reads settings from localStorage at runtime. To configure the endpoint, either:
1. Use the in-app Settings page
2. Build with environment variables baked in
3. Set the default in the UI and clear localStorage

### Backend Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `CORS_ALLOWED_ORIGINS` | `*` | CORS allowed origins |
| `RATE_LIMIT_ENABLED` | `true` | Enable rate limiting |
| `RATE_LIMIT_REQUESTS` | `100` | Requests per minute |

## Examples

### Basic Usage

```bash
docker run -d \
  --name mydevstack \
  -p 3000:3000 \
  -e AWS_ENDPOINT=http://192.168.1.100:4566 \
  -e AWS_REGION=us-us-east-1 \
  beabys/mydevstack:latest
```

### With LocalStack

```bash
# Start LocalStack first
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=s3,lambda,dynamodb,sqs,sns,iam,kms,secretsmanager,ssm \
  localstack/localstack:latest

# Start MyDevStack
docker run -d \
  --name mydevstack \
  -p 3000:3000 \
  --link localstack \
  -e AWS_ENDPOINT=http://localstack:4566 \
  beabys/mydevstack:latest
```

### With Custom Nginx Configuration

```bash
docker run -d \
  --name mydevstack \
  -p 3000:3000 \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  beabys/mydevstack:latest
```

### Production Deployment with SSL

```yaml
version: '3.8'

services:
  mydevstack:
    image: beabys/mydevstack:latest
    ports:
      - "3000:3000"
    environment:
      - AWS_ENDPOINT=https://aws.example.com
      - AWS_REGION=us-east-1

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - mydevstack
```

## Building from Source

### Prerequisites

- Docker 24.0+
- Git

### Release Process

1. Create a git tag with prefix `v`:
   ```bash
   git add release.json
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions will build and push the image

## Supported Services

| Service | Status | Description |
|---------|--------|-------------|
| S3 | ✅ | Buckets, Objects, Presigned URLs |
| Lambda | ✅ | Functions, Invocations |
| DynamoDB | ✅ | Tables, Items, Streams |
| SQS | ✅ | Queues, Messages |
| SNS | ✅ | Topics, Subscriptions, Publishing |
| IAM | ✅ | Users, Roles, Groups, Policies |
| KMS | ✅ | Keys, Encryption |
| Secrets Manager | ✅ | Secrets management |
| SSM | ✅ | Parameter Store |
| API Gateway | ✅ | REST APIs, HTTP APIs |
| Kinesis | ✅ | Streams, Shards |
| CloudFormation | ✅ | Stacks, Templates |

## Development

### Project Structure

```
pkg/
├── proxy/              # Go backend (hexagonal architecture)
│   ├── cmd/server/    # Entry point
│   ├── internal/
│   │   ├── adapters/  # AWS & HTTP adapters
│   │   ├── application/  # Business logic
│   │   ├── config/   # Configuration
│   │   └── ports/   # Interfaces
│   └── mocks/ports/  # Generated mocks
└── ui/               # Vue 3 frontend
    └── src/
        ├── api/          # API clients
        ├── components/    # Vue components
        │   ├── common/   # Shared (Modal, Table, FormInput, Button)
        │   ├── layout/   # Layout (Sidebar, TopBar, ServiceCard)
        │   └── <service>/ # Service-specific components
        ├── composables/  # Vue composables (useToast, useTheme)
        ├── stores/      # Pinia stores
        ├── types/      # TypeScript types
        └── views/      # Page views
```

### Adding a New AWS Service

See [ADDING_SERVICES.md](ADDING_SERVICES.md) for detailed instructions.

Quick steps:
1. Create API client in `api/services/<service>.ts`
2. Create components in `components/<service>/` (create `index.ts` barrel export!)
3. Create view in `views/services/<Service>.vue`
4. Add route in `router/index.ts`
5. Add navigation in `layout/Sidebar.vue`

Typical files per service: 5-7 files

### Running Tests

```bash
# Go backend
go test ./pkg/proxy/...

# Vue frontend
cd pkg/ui && npm run test:run

# Single test file
cd pkg/ui && npm run test:run src/stores/settings.test.ts
```

### Building

```bash
# Full build (Go + Vue)
make build

# Go only
make run-proxy

# Vue only
cd pkg/ui && npm run dev
```

### Linting

```bash
# All linters
make lint

# Go only
make lint-proxy

# Vue only
cd pkg/ui && npm run lint
```

## License

This project is licensed under the [MIT License](LICENSE).

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

## Support

If you find this project helpful, consider buying me a coffee!

<a href="https://www.buymeacoffee.com/beabys" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>