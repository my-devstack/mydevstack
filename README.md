# MyDevStack

<img src="./logo.svg" alt="MyDevStack Logo" width="128" align="center" />

A modern, developer-friendly web interface for managing AWS services running locally via AWS emulators like LocalStack, FloCi, or MiniStack.

![Docker](https://img.shields.io/badge/Docker-24.0+-2496ED?style=flat&logo=docker)
![Multi-platform](https://img.shields.io/badge/Platforms-linux_darwin_windows-FF6B6B?style=flat)
![License](https://img.shields.io/badge/License-MIT-ea580c)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/beabys)


## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_PORT` | `8081` | Backend proxy port |
| `AWS_ENDPOINT` | `http://localhost:4566` | AWS emulator endpoint |
| `AWS_ACCESS_KEY` | `test` | AWS access key |
| `AWS_SECRET_KEY` | `test` | AWS secret key |

---

## Using Make Commands

For convenience, you can use the Makefile:

```bash
# Start both proxy and UI
make run-proxy   # Terminal 1
make run-ui     # Terminal 2
```

---

## Docker Compose Files

| File | Description |
|------|-------------|
| `docker-compose.yml` | MyDevStack + aws emulator on port 4566 |
| `docker-compose-floci.yml` | FloCi + MyDevStack |
| `docker-compose-ministack.yml` | MiniStack + MyDevStack |

### Using Docker Directly

```bash
# Start your emulator first (e.g., FloCi)
docker run -d --name floci -p 4566:4566 floci/floci:latest

# Then run MyDevStack
docker run -d \
  -p 3000:3000 \
  -p 8081:8081 \
  -e AWS_ENDPOINT=http://host.docker.internal:4566 \
  beabys/mydevstack:latest
```

---

## Development

### Prerequisites

- **Go** 1.26+
- **Node.js** 24+
- **Docker** (for running emulators)

### Running Locally

```bash
# Clone the repo
git clone https://github.com/beabys/mydevstack.git
cd mydevstack

# Install UI dependencies
cd pkg/ui && npm install

# Start Go proxy (port 8081)
go run ./pkg/proxy/cmd/server

# Start Vue dev server (port 3000) - in another terminal
cd pkg/ui && npm run dev
```

### Running Tests

```bash
# Go backend
make test

# Vue frontend
cd pkg/ui && npm run test:run

# E2E tests
make test-e2e
```

### Building

```bash
# Full build
make dist    # Vue only
make build   # Go + Vue
```

---

## Project Structure

```
mydevstack/
├── .github/                 # GitHub workflows
├── pkg/
│   ├── proxy/              # Go backend API proxy
│   │   ├── cmd/            # Entry points
│   │   ├── internal/       # Business logic (hexagonal architecture)
│   │   └── mocks/          # Generated mocks
│   ├── ui/                 # Vue 3 frontend
│   │   ├── src/
│   │   │   ├── api/        # API clients
│   │   │   ├── components/ # Vue components
│   │   │   ├── composables/# Vue composables
│   │   │   ├── stores/     # Pinia stores
│   │   │   └── views/      # Page views
│   │   └── package.json
│   └── test/               # Playwright E2E tests
├── docker-compose-floci.yml
├── docker-compose-ministack.yml
└── .env.example
```

---

## Supported AWS Services

> **MiniStack note**: MSK and OpenSearch are not supported by MiniStack. The UI shows a warning banner and disables create actions when running on MiniStack.

| Service | Status | Description |
|---------|--------|-------------|
| S3 | ✅ | Buckets, Objects, Presigned URLs |
| Lambda | ✅ | Functions, Invocations |
| DynamoDB | ✅ | Tables, Items |
| DynamoDB Streams | ✅ | Stream records, shards |
| SQS | ✅ | Queues, Messages |
| SNS | ✅ | Topics, Subscriptions, Publishing |
| IAM | ✅ | Users, Roles, Groups, Policies |
| KMS | ✅ | Keys, Encryption, Decryption |
| Secrets Manager | ✅ | Secrets management |
| SSM | ✅ | Parameter Store, SecureString |
| API Gateway | ✅ | REST APIs, HTTP APIs, Integrations |
| Kinesis | ✅ | Streams, Shards, Records |
| CloudFormation | ✅ | Stacks, Templates, Resources |
| ElastiCache | ✅ | Redis Server Groups, Cache Nodes |
| RDS | ✅ | Databases, Instances, Snapshots |
| SES | ✅ | Emails, Templates, Send |
| Step Functions | ✅ | State Machines, Executions |
| OpenSearch | ✅ | Domains, Config (requires LocalStack or FloCi) |
| MSK | ✅ | Clusters, Bootstrap Brokers (requires LocalStack or FloCi) |

---

## Adding New AWS Services

See [ADDING_SERVICES.md](ADDING_SERVICES.md) for detailed instructions.

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Support

<a href="https://www.buymeacoffee.com/beabys" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>