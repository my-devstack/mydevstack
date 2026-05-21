# Contributing to MyDevStack

Thank you for your interest in contributing!

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/mydevstack.git`
3. **Create** a feature branch: `git checkout -b feature/my-new-feature`

## Development Setup

### Prerequisites

- Go 1.26+
- Node 20+
- Docker 24.0+ (for running the application)
- Docker Compose (for local development)

### Project Structure

```
mydevstack/
├── pkg/
│   ├── proxy/          # Go backend (Gin, AWS SDK v2)
│   │   ├── cmd/server  # Entry point
│   │   └── internal/
│   │       ├── adapters/    # AWS implementations
│   │       └── ports/        # Interfaces
│   └── ui/             # Vue 3 frontend
│       ├── src/
│       │   ├── api/services/    # API clients
│       │   ├── components/      # Vue components
│       │   ├── composables/     # Vue composables
│       │   ├── views/           # Page views
│       │   └── router/          # Vue Router
│       └── e2e/             # Playwright E2E tests
├── e2e/                # Service E2E tests
└── Makefile            # Build & test commands
```

### Available Services

The following AWS services are currently implemented:

| Service | Frontend Path | API Client |
|---------|---------------|------------|
| API Gateway | `/services/api-gateway` | `api/services/api-gateway.ts` |
| CloudFormation | `/services/cloudformation` | `api/services/cloudformation.ts` |
| DynamoDB | `/services/dynamodb` | `api/services/dynamodb.ts` |
| ElastiCache | `/services/elasticache` | `api/services/elasticache.ts` |
| IAM | `/services/iam` | `api/services/iam.ts` |
| Kinesis | `/services/kinesis` | `api/services/kinesis.ts` |
| KMS | `/services/kms` | `api/services/kms.ts` |
| Lambda | `/services/lambda` | `api/services/lambda.ts` |
| RDS | `/services/rds` | `api/services/rds.ts` |
| S3 | `/services/s3` | `api/services/s3.ts` |
| Secrets Manager | `/services/secrets-manager` | `api/services/secrets-manager.ts` |
| SNS | `/services/sns` | `api/services/sns.ts` |
| SQS | `/services/sqs` | `api/services/sqs.ts` |
| SSM | `/services/ssm` | `api/services/ssm.ts` |

### Running Locally

```bash
# Run Go backend (port 8080)
make run-proxy

# Run Vue dev server (port 3000)
cd pkg/ui && pnpm run dev
```

### Building

```bash
# Build both Go and Vue
make build

# Build Docker image
docker build -t beabys/mydevstack:latest .
```

## Testing

### Go Tests

```bash
# Unit tests (excludes mocks)
make unit

# Include mocks
go test ./pkg/proxy/...
```

### Vue Tests

```bash
# Run all unit tests
cd pkg/ui && pnpm run test:run

# Run single test file
cd pkg/ui && pnpm exec vitest run <file>
```

### Storybook (Component Development)

```bash
# Start Storybook (port 6006)
cd pkg/ui && pnpm run storybook

# Build static Storybook
cd pkg/ui && pnpm run build-storybook
```

**Why use Storybook?**
- Develop components in isolation without backend
- Test all states (loading, empty, error) visually
- Document component API automatically

**When to use:**
- Building new UI components
- Creating stories for existing services
- Visual regression testing

### E2E Tests

E2E tests require Floci/LocalStack running on port 4566:

```bash
# Run all E2E tests
make test-e2e

# Run specific service E2E test
cd pkg/ui && pnpm exec playwright test e2e/services/iam.spec.ts
```

## Release Process

1. Update `release.json` with new versions
2. Create a git tag with prefix `v`:
   ```bash
   git add release.json
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will build and push the Docker image

## Submitting Changes

1. **Test** your changes locally
2. **Lint** your code:
   ```bash
   make lint              # All
   make lint-proxy        # Go only
   make lint-ui           # Vue only
   ```
3. **Commit** with clear, descriptive messages
4. **Push** to your fork
5. **Open** a Pull Request against `main` branch

### Pull Request Guidelines

- Describe the changes and the motivation
- Link to any related issues
- Include any documentation updates
- Ensure all tests pass

### Adding a New Service

See [ADDING_SERVICES.md](./ADDING_SERVICES.md) for detailed instructions.

## Reporting Bugs

1. Check if the issue already exists
2. Create a detailed issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Go/Node/Docker version and environment details

## Questions?

Feel free to open an issue for questions about contributing or the project in general.