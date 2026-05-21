# External Integrations

**Analysis Date:** 2026-05-21

## AWS Services (Backend - Go Proxy)

The Go proxy at `pkg/proxy/internal/adapters/aws/` wraps AWS SDK v2 clients using hexagonal architecture. Each service has a port interface in `pkg/proxy/internal/ports/service.go` and an adapter in `pkg/proxy/internal/adapters/aws/`. All requests are proxied to an AWS-compatible emulator endpoint.

| Service | SDK Package | Port Interface | Adapter File | Operations |
|---------|-------------|----------------|-------------|------------|
| S3 | `aws-sdk-go-v2/service/s3` | `S3Port` | `s3.go` | CRUD buckets/objects, presign, versioning, encryption, tagging, policies, notifications |
| Lambda | `aws-sdk-go-v2/service/lambda` | `LambdaPort` | `lambda.go` | CRUD functions, invoke, event source mappings |
| DynamoDB | `aws-sdk-go-v2/service/dynamodb` | `DynamoDBPort` | `dynamodb.go` | CRUD tables, items, query, scan, batch, TTL |
| DynamoDB Streams | `aws-sdk-go-v2/service/dynamodbstreams` | `DynamoDBStreamsPort` | `dynamodbstreams.go` | List streams, describe, get shard iterator, get records |
| API Gateway (REST) | `aws-sdk-go-v2/service/apigateway` | `APIGatewayPort` | `apigateway.go` | CRUD APIs, resources, methods, integrations, stages, deployments |
| API Gateway (HTTP) | `aws-sdk-go-v2/service/apigatewayv2` | `APIGatewayV2Port` | `apigatewayv2.go` | CRUD APIs, routes, integrations, stages |
| SQS | `aws-sdk-go-v2/service/sqs` | `SQSPort` | `sqs.go` | CRUD queues, send/receive/delete messages, purge, attributes |
| SNS | `aws-sdk-go-v2/service/sns` | `SNSPort` | `sns.go` | CRUD topics, subscribe/publish, list subscriptions |
| SESv2 | `aws-sdk-go-v2/service/sesv2` | `SESv2Port` | `sesv2.go` | Email identities, send email, templates, contact lists, suppression |
| IAM | `aws-sdk-go-v2/service/iam` | `IAMPort` | `iam.go` | CRUD users/roles/policies/groups, access keys, attach/detach policies |
| KMS | `aws-sdk-go-v2/service/kms` | `KMSPort` | `kms.go` | CRUD keys, encrypt/decrypt, generate data keys/random |
| Secrets Manager | `aws-sdk-go-v2/service/secretsmanager` | `SecretsManagerPort` | `secretsmanager.go` | CRUD secrets, rotation, random passwords |
| Step Functions | `aws-sdk-go-v2/service/sfn` | `StepFunctionsPort` | `stepfunctions.go` | CRUD state machines, start/stop executions, history |
| SSM | `aws-sdk-go-v2/service/ssm` | `SSMPort` | `ssm.go` | Parameters CRUD, get by path, tagging |
| Kinesis | `aws-sdk-go-v2/service/kinesis` | `KinesisPort` | `kinesis.go` | CRUD streams, shards, put/get records, enhanced monitoring |
| CloudFormation | `aws-sdk-go-v2/service/cloudformation` | `CloudFormationPort` | `cloudformation.go` | CRUD stacks, templates, stack resources |
| CloudWatch | `aws-sdk-go-v2/service/cloudwatch` | `CloudWatchPort` | `cloudwatch.go` | CRUD alarms, metrics data, put metrics |
| CloudWatch Logs | `aws-sdk-go-v2/service/cloudwatchlogs` | `CloudWatchLogsPort` | `cloudwatchlogs.go` | Log groups/streams, put/get log events, metric filters |
| RDS | `aws-sdk-go-v2/service/rds` | `RDSPort` | `rds.go` | CRUD DB instances, engine versions, modify, reboot |
| ElastiCache | `aws-sdk-go-v2/service/elasticache` | `ElastiCachePort` | `elasticache.go` | CRUD replication groups |
| MSK (Kafka) | `aws-sdk-go-v2/service/kafka` | `MSKPort` | `msk.go` | CRUD clusters v2, bootstrap brokers |
| OpenSearch | `aws-sdk-go-v2/service/opensearch` | `OpenSearchPort` | `opensearch.go` | CRUD domains, config, tagging, compatible versions |

**Connection:** `pkg/proxy/internal/proxy/service.go` lines 75-110
- AWS config loaded via `aws-sdk-go-v2/config` with static credentials
- Endpoint override set to `cfg.AWS.Endpoint` (default: `http://localhost:4566`)
- Region: default `us-east-1`, changeable via runtime `/proxy/region` endpoint
- Credentials: configurable via `AWS_ACCESS_KEY` / `AWS_SECRET_KEY` env vars (defaults: `test`/`test`)

## AWS Services (Frontend - Vue Browser)

The Vue frontend at `pkg/ui/src/api/` uses AWS SDK v3 clients directly in the browser (`pkg/ui/src/api/services/`). Each service file implements CRUD operations against the AWS emulator via the Go proxy.

| Service | SDK Package | Service File | Test File |
|---------|-------------|-------------|-----------|
| S3 | `@aws-sdk/client-s3` | `s3.ts` | `s3.test.ts` |
| Lambda | `@aws-sdk/client-lambda` | `lambda.ts` | `lambda.test.ts` |
| DynamoDB | `@aws-sdk/client-dynamodb` | `dynamodb.ts` | `dynamodb.test.ts` |
| SQS | `@aws-sdk/client-sqs` | `sqs.ts` | `sqs.test.ts` |
| SNS | `@aws-sdk/client-sns` | `sns.ts` | `sns.test.ts` |
| IAM | (via Go proxy REST) | `iam.ts` | `iam.test.ts` |
| KMS | `@aws-sdk/client-kms` | `kms.ts` | `kms.test.ts` |
| Secrets Manager | `@aws-sdk/client-secrets-manager` | `secrets-manager.ts` | `secrets-manager.test.ts` |
| Step Functions | `@aws-sdk/client-sfn` | `stepfunctions.ts` | `stepfunctions.test.ts` |
| SSM | `@aws-sdk/client-ssm` | `ssm.ts` | `ssm.test.ts` |
| CloudWatch | `@aws-sdk/client-cloudwatch` | `cloudwatch.ts` | `cloudwatch.test.ts` |
| CloudWatch Logs | `@aws-sdk/client-cloudwatch-logs` | `cloudwatch-logs.ts` | `cloudwatch-logs.test.ts` |
| API Gateway (REST) | `@aws-sdk/client-api-gateway` | `api-gateway.ts` | `api-gateway.test.ts` |
| API Gateway (HTTP) | `@aws-sdk/client-apigatewayv2` | (in api-gateway) | - |
| Kinesis | `@aws-sdk/client-kinesis` | `kinesis.ts` | `kinesis.test.ts` |
| ElastiCache | `@aws-sdk/client-elasticache` | `elasticache.ts` | `elasticache.test.ts` |
| RDS | `@aws-sdk/client-rds` | `rds.ts` | `rds.test.ts` |
| DynamoDB Streams | `@aws-sdk/client-dynamodb-streams` | (in dynamodb) | - |
| CloudFormation | `@aws-sdk/client-cloudformation` | `cloudformation.ts` | `cloudformation.test.ts` |
| MSK | (via Go proxy REST) | `msk.ts` | `msk.test.ts` |
| OpenSearch | (via Go proxy REST) | `opensearch.ts` | `opensearch.test.ts` |
| SES | `@aws-sdk/client-sesv2` | `ses.ts` | `ses.test.ts` |
| EventBridge | `@aws-sdk/client-eventbridge` | (in index) | - |
| SSM | `@aws-sdk/client-ssm` | `ssm.ts` | `ssm.test.ts` |

**Frontend API Client:** `pkg/ui/src/api/client.ts`
- Wraps axios with mock SigV4 signing (`X-Mock-Signature` header)
- Singleton API client with request/response interceptors
- `APIError` class with service, status code, and error code
- Error handling for CORS/network errors, server errors, and client errors
- Timeout: 30 seconds

**Proxy Routing:** `pkg/ui/vite.config.ts`
- Dev mode: Vite proxy forwards `/s3/*`, `/lambda/*`, `/dynamodb/*`, `/sqs/*`, `/sns/*`, `/iam/*`, `/kms/*`, `/secretsmanager/*`, `/events/*`, `/logs/*`, `/ssm/*`, `/restapis/*`, `/v2/apis/*`, `/apigateway/*`, `/kinesis/*`, `/cloudformation/*`, `/cognito-idp/*`, `/elasticache/*`, `/rds/*`, `/stepfunctions/*` to Go proxy backend
- Production: nginx serves as reverse proxy

## AWS Emulators

**Primary - Floci:**
- Image: `floci/floci:latest` (`docker-compose-floci.yml`)
- Port: 4566 (AWS-compatible), 5100-5199 (ECR), 6379-6399 (ElastiCache), 7001-7099 (RDS)
- Storage: hybrid mode, persistent at `.dev/data/floci/`
- Features: Lambda with Docker executor, hot reload, SES SMTP integration with Mailpit
- Sets `EMULATOR=FLOCI` env var
- Requires Docker socket (`/var/run/docker.sock`)

**Secondary - Ministack:**
- Image: `ministackorg/ministack:latest` (`docker-compose-ministack.yml`)
- Port: 4566
- Requires Redis 7-alpine for state persistence
- Features: Lambda local executor, S3 persistence, RDS/ElastiCache proxy ports
- Sets `EMULATOR=MINISTACK` env var

**Simple Docker:**
- `docker-compose.yml` - Standalone app container, expects external AWS emulator at `host.docker.internal:4566`

## GitHub API

**Integration:** `pkg/proxy/internal/adapters/github/release.go`
- HTTP client fetches latest release from `https://api.github.com/repos/{owner}/{repo}/releases/latest`
- No authentication required (public GitHub API)
- Timeout: 10 seconds
- User-Agent: `mydevstack`
- Default repo: `https://github.com/my-devstack/mydevstack` (configurable via `GITHUB_REPO` env)

**Version Service:** `pkg/proxy/internal/version/version.go`
- Periodic scheduler (configurable interval, default 24h) checks GitHub for latest release
- Results cached in-memory (`pkg/proxy/internal/cache/cache.go`) with 25h TTL
- Uses `ports.CachePort` and `ports.GitHubClientPort` interfaces
- Exposes version data to frontend via `/health` endpoint

## Data Storage

**Databases:**
- None (app has no permanent data storage)
- AWS emulator state stored in emulator containers (Floci at `.dev/data/floci/`, Ministack uses Redis)

**File Storage:**
- Local filesystem only for emulator persistence
- No production database; app is a UI/management console for AWS emulators

**Caching:**
- In-memory TTL cache (`pkg/proxy/internal/cache/cache.go`)
- Thread-safe with `sync.RWMutex`
- Used for: GitHub release version cache (25h TTL), health check status (30s TTL in handler)

## Authentication & Identity

**Auth Provider:**
- None (local development tool)
- Mock SigV4 signing in browser via `pkg/ui/src/api/client.ts` (`X-Mock-Signature` header)
- AWS credentials configured via env vars or Pinia settings store (for display only)
- No real AWS authentication required for emulator access

## Monitoring & Observability

**Logging:**
- Go backend: `log/slog`-style via standard `log` package
- Gin request logging via `gin.Logger()` middleware
- [Version] prefix for version service logs
- Console output only (no log aggregation)

**Health Check:**
- `GET /health` endpoint at `pkg/proxy/internal/adapters/http/handlers.go`
- Returns version, build info, and backend health status (30s cached)
- Docker HEALTHCHECK uses `curl -f http://localhost:3000`

**Error Tracking:**
- None

## CI/CD & Deployment

**Hosting:**
- Docker Hub (`beabys/mydevstack`) - container image distribution
- Nginx-based container for production deployment

**CI Pipeline:**
- GitHub Actions (`.github/workflows/test.yml`)
  - Lint Proxy (golangci-lint)
  - Lint UI (ESLint)
  - Test UI (vitest with coverage)
  - Test Proxy (go test with 90% coverage threshold)
  - E2E Tests (Playwright, requires Floci, needs lint+unit passing first)

**Release Pipeline:**
- GitHub Actions (`.github/workflows/release.yml`)
  - Trigger: tag `v*` on `main` branch
  - Builds multi-platform Go binaries (5 arch/OS combinations)
  - Builds Vue UI dist
  - Creates GitHub Release with changelog (PRs since last tag)
  - Builds and pushes multi-architecture Docker image (`linux/amd64`, `linux/arm64`)
  - Publishes to Docker Hub

## Environment Configuration

**Required env vars:**
- `AWS_ENDPOINT` - AWS emulator endpoint (default: `http://localhost:4566`)
- `AWS_ACCESS_KEY` - AWS access key for emulator (default: `test`)
- `AWS_SECRET_KEY` - AWS secret key for emulator (default: `test`)

**Optional env vars:**
- `PROXY_PORT` - Go proxy listen port (default: `8081`)
- `EMULATOR` - Emulator type (`FLOCI` or `MINISTACK`)
- `SERVICE_PATTERN` - URL routing pattern (default: `root`)
- `GITHUB_REPO` - GitHub repo URL for version checks (default: `https://github.com/my-devstack/mydevstack`)
- `VERSION_CHECK_HOURS` - Version check interval (default: `24`)
- `CONFIG_FILE` - Path to YAML config file (default: `config.yaml`)
- `VITE_PROXY_BACKEND` - Frontend proxy backend URL (default: `http://127.0.0.1:8081`)

**Secrets location:**
- No secrets management system; credentials are dev-only defaults (test/test)
- Docker secrets referenced in CI: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None (GitHub API calls are pull-based, no webhooks)

## Additional External Integrations

**Mailpit:**
- Image: `axllent/mailpit` (`docker-compose-floci.yml`)
- SMTP capture for SESv2 emails sent via Floci
- Web UI on port 8025
- SMTP on port 1025

**Redis:**
- Image: `redis:7-alpine` (`docker-compose-ministack.yml`)
- Used by Ministack for state persistence
- Port 6379 (localhost only)

---

*Integration audit: 2026-05-21*
