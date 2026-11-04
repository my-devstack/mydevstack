# Configuration

MyDevStack reads configuration from three sources in this order (later wins):

1. **Defaults** — compiled into the proxy binary.
2. **Config file** — YAML file pointed to by `CONFIG_FILE` (optional). Supports `${VAR}` placeholders substituted from the environment.
3. **Environment variables** — override both file and defaults.

The proxy is the only process that reads `config.yaml` / env vars. The UI is a static SPA and reads its backend URL from a build-time env var or a runtime `window.__MYDEVSTACK__` object injected by the container.

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `CONFIG_FILE` | _(unset)_ | Absolute path to a YAML config file. If set and the file exists, it is loaded first. Missing file is silently ignored. |
| `PROXY_PORT` | `8081` | Port the Go proxy listens on. |
| `AWS_ENDPOINT` | `http://localhost:4566` | AWS emulator endpoint (LocalStack / FloCi / MiniStack). |
| `AWS_ACCESS_KEY` | `test` | AWS access key forwarded to the emulator. |
| `AWS_SECRET_KEY` | `test` | AWS secret key forwarded to the emulator. |
| `EMULATOR` | _(empty)_ | Emulator flavor identifier (used by `/health` and UI banner). |
| `SERVICE_PATTERN` | _(unset)_ | Optional filter over service paths. |
| `GITHUB_REPO` | `https://github.com/my-devstack/mydevstack` | Repo URL used by the version check. |
| `VERSION_CHECK_HOURS` | `24` | How often the proxy polls GitHub for a newer release. |
| `READ_ONLY_MODE` | `false` | `true` locks the proxy + UI to read-only. See [Read-only mode](#read-only-mode). |

## Config file example

```yaml
# mydevstack.yaml
port: 8081
aws:
  endpoint: ${AWS_ENDPOINT:-http://localhost:4566}
  access_key: ${AWS_ACCESS_KEY:-test}
  secret_key: ${AWS_SECRET_KEY:-test}
emulator: floci
github_repo: https://github.com/my-devstack/mydevstack
version_check_hours: 24
read_only_mode: false
```

`${VAR}` placeholders are resolved from environment variables at load time. The default config file shipped with the source tree is [`pkg/proxy/config.yaml`](../pkg/proxy/config.yaml).

## Precedence rules

- `CONFIG_FILE` only selects *which* file to load — it is not itself a config key.
- Env vars always beat values from the YAML file.
- Defaults are the last fallback.
- The file is optional: with no `CONFIG_FILE` and no env vars, the proxy runs on port `8081` against `http://localhost:4566`.

Load the file explicitly:

```bash
CONFIG_FILE=/etc/mydevstack/config.yaml ./mydevstack-proxy
```

## Ports and URLs

| What | Default | Notes |
|---|---|---|
| Go proxy | `http://localhost:8081` | Override with `PROXY_PORT`. |
| UI (dev) | `http://localhost:3000` | `make run-ui`. |
| UI (container) | `http://localhost:3000` | Same port, static build served by nginx. |
| Emulator | `http://localhost:4566` | Override with `AWS_ENDPOINT`. |
| Storybook | `http://localhost:6006` | `pnpm run storybook` from `pkg/ui`. |

In dev mode the Vite proxy (`pkg/ui/vite.config.ts`) forwards `/health`, `/proxy`, `/s3`, `/ec2`, `/dynamodb`, `/lambda`, `/sqs`, `/sns`, `/iam`, `/kms`, `/secretsmanager`, `/ssm`, `/apigateway`, `/apigatewayv2`, `/kinesis`, `/cloudformation`, `/cloudwatch`, `/cognito`, `/elasticache`, `/rds`, `/ses`, `/states`, `/opensearch`, `/msk`, `/ecs`, `/ecr`, `/cloudfront`, `/vpc`, `/sts` to the Go proxy.

## `/health` contract

```
GET http://localhost:8081/health
```

Response (200 when emulator reachable, 503 otherwise):

```json
{
  "status": "healthy",
  "proxy": "aws-proxy",
  "target": "http://localhost:4566",
  "endpoint_url": "http://localhost:4566",
  "region": "us-east-1",
  "emulator": "floci",
  "github_repo": "https://github.com/my-devstack/mydevstack",
  "latestVersion": "v1.2.3",
  "read_only_mode": false
}
```

`status` is `healthy` when the emulator returns 2xx/3xx on `/_localstack/health` (cached for 30s), `unhealthy` otherwise. `latestVersion` is empty when the GitHub poll has not returned yet or is disabled.

## Runtime region switch

Region is a per-session value stored in the UI Pinia store and in the proxy process memory. It is **not** persisted in `config.yaml`.

```bash
curl -X POST http://localhost:8081/proxy/region \
  -H 'Content-Type: application/json' \
  -d '{"region": "eu-west-1"}'
```

Response:

```json
{ "region": "eu-west-1", "message": "Region updated successfully" }
```

The UI exposes the same action via the region selector in the top bar. Changing region in the UI calls `POST /proxy/region` on the user's behalf.

## Read-only mode

Set `READ_ONLY_MODE=true` (or `read_only_mode: true` in YAML) and restart the proxy. The value is read once at boot — changing it at runtime requires a restart.

### Behavior

- `GET`, `HEAD`, `OPTIONS` pass through untouched.
- `POST /proxy/region` is explicitly allowed (region switch still works).
- Every other `POST` / `PUT` / `PATCH` / `DELETE` returns:

  ```
  HTTP/1.1 403 Forbidden
  Content-Type: application/json

  {
    "error": "Action not allowed: server is in read-only mode",
    "code": "READ_ONLY"
  }
  ```

- The UI shows a persistent banner reading **"Read-only mode — create, edit and delete are disabled"** and every mutating button is disabled with `title="Read-only mode: action not allowed"`.
- If the user somehow triggers a mutating call, `api/client.ts` surfaces the same message as a toast.

### Known limitation

Some AWS reads are issued over `POST` by the SDK. Under read-only mode those return 403 even though they do not mutate state. Affected calls include EC2 `DescribeInstances`, DynamoDB `Query` / `Scan` and stream-record fetches, ECR `BatchGetImage`, CloudWatch `GetMetricData` / `GetMetricStatistics`, API Gateway invoke-URL tests, SSM `GetParameters` (batch), and Kinesis `GetShardIterator`. See the migration plan in [`.opencode/plans/2026-11-03-read-endpoints-get-migration.md`](../.opencode/plans/2026-11-03-read-endpoints-get-migration.md).

## UI backend resolution

The UI needs to know where the Go proxy lives. Resolution order:

1. **Runtime injection** (`window.__MYDEVSTACK__.proxyBackend`) — set by the container entrypoint writing `/config.js` at startup. Used when the UI and proxy run behind the same nginx and the user wants to override the origin without rebuilding.
2. **Build-time env var** `VITE_PROXY_BACKEND` — bakes the URL into the bundle. Use when the bundle is served without nginx (direct open, separate host).
3. **Production default** `''` (same-origin) — production builds without the two above call the origin that served the page; nginx forwards `/health`, `/s3`, etc. to the Go backend.
4. **Dev default** `http://127.0.0.1:8081` — used by `make run-ui` / `pnpm run dev`. The Vite dev proxy rewrites API paths to the Go backend.

For day-to-day local development you do not need to set anything — the dev default plus the Vite proxy are enough.
