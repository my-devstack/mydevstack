# Troubleshooting

Symptom → cause → fix, ordered roughly by how often they hit. Commands assume the default ports (UI `3000`, proxy `8081`, emulator `4566`).

| Symptom | Cause | Fix |
|---|---|---|
| UI shows **"Cannot reach the AWS endpoint"** or CORS errors on every service call | Proxy cannot talk to the emulator, or browser is calling the wrong origin. | 1. `curl http://localhost:4566/_localstack/health` — must return 200.<br>2. `curl http://localhost:8081/health` — check `target` / `endpoint_url` fields.<br>3. If the emulator runs on another host, set `AWS_ENDPOINT=http://<host>:4566` and restart the proxy.<br>4. Inside Docker on Linux, `localhost` inside the container is the container itself. Pass `--add-host host.docker.internal:host-gateway` and use `AWS_ENDPOINT=http://host.docker.internal:4566`, or use the LAN IP directly. |
| `GET /health` returns **503** with `"status": "unhealthy"` | Proxy is up, emulator is down or unreachable from the proxy. | Same as above. Confirm the emulator container is running: `docker ps` and look for LocalStack / FloCi / MiniStack. Check emulator logs. |
| `listen: address already in use` on **3000 / 8081 / 4566 | Another process (zombie dev server, stale docker port mapping) holds the port. | `lsof -ti:8081 \| xargs kill -9` (same for `3000`, `4566`). For Docker-owned ports: `docker ps` → `docker stop <id>`. |
| Emulator not running but `make run-proxy` starts fine | Expected — proxy starts regardless. It only fails requests. | Start LocalStack / FloCi / MiniStack first. See [Getting Started](./getting-started.md). Verify with `curl http://localhost:4566/_localstack/health`. |
| Service list is empty even though emulator has resources | Region mismatch between UI and emulator, or emulator started with a non-default region. | Check `GET /health` → `region`. Switch region with `POST /proxy/region` (see [Configuration](./configuration.md#runtime-region-switch)) or via the UI region selector. |
| Button click → toast **"Read-only mode: action not allowed"** or API returns `403 {"error":"Action not allowed: server is in read-only mode","code":"READ_ONLY"}` | `READ_ONLY_MODE=true` at boot. | Either restart the proxy with `READ_ONLY_MODE=false`, or accept the mode. Note: some SDK reads are issued over POST and are blocked too — see [Configuration § Known limitation](./configuration.md#known-limitation). |
| 403 on a GET-like action (EC2 describe, DynamoDB query, CloudWatch metrics, …) while read-only is on | Known limitation — those reads travel over POST. | Documented in [Configuration § Known limitation](./configuration.md#known-limitation). Workaround: temporarily disable read-only mode. |
| `make run-proxy` fails with `missing go.sum entry` / `go mod tidy` errors | Module cache stale after a rebase or a dependency bump. | `cd pkg/proxy && go mod tidy` (the Makefile does this for you). Re-run `make run-proxy`. |
| `pnpm install` fails with `The engine "node" is incompatible` | Wrong Node version. Project requires Node 24. | `node -v` → must start with `v24.`. Use `nvm install 24 && nvm use 24`. pnpm installs run with `--frozen-lockfile` in CI. |
| E2E tests time out or hang on "waiting for locator" | One of the three services (emulator / proxy / UI) is not up, or the emulator has leftover `test-*` data from a previous aborted run. | 1. `docker ps` — emulator up.<br>2. `curl http://localhost:8081/health` — 200.<br>3. `curl -I http://localhost:3000` — 200.<br>4. Clean stale test data via the proxy API (delete every `test-*` bucket/table/queue/...).<br>5. Re-run with `PROXY_URL=http://localhost:8081 pnpm exec playwright test`. |
| Docker on Linux: UI or proxy cannot reach emulator via `host.docker.internal` | `host.docker.internal` is a macOS/Windows Docker Desktop convention; on Linux it must be opted in. | Run the container with `--add-host host.docker.internal:host-gateway`, or replace `host.docker.internal` with the host LAN IP (`ip addr show docker0`). |
| Version banner shows "update available" but GitHub releases look current | `VERSION_CHECK_HOURS` not elapsed yet, or cached response. | Wait for the next poll or restart the proxy. The poll result is cached in memory. |
| Storybook shows blank canvas or API errors | Storybook runs on `6006` but has no proxy; API calls need a target. | Set `VITE_PROXY_BACKEND=http://localhost:8081` when starting Storybook, or rely on the mocked decorators shipped with each story. |

## Diagnostic commands

```bash
# Emulator alive?
curl -s http://localhost:4566/_localstack/health | head

# Proxy alive, emulator reachable from proxy?
curl -s http://localhost:8081/health | jq

# UI reachable?
curl -I http://localhost:3000

# Who owns a port?
lsof -ti:3000
lsof -ti:8081
lsof -ti:4566

# Docker containers running
docker ps
```

## When nothing helps

1. Stop everything: `pkill -f 'go run cmd/server'; pkill -f vite; docker compose -f examples/docker-compose/docker-compose.yml down`.
2. Confirm ports free: `lsof -ti:3000,8081,4566`.
3. Follow the quickstart in [Getting Started](./getting-started.md) from a clean shell.
4. Compare your `/health` output with the example in [Configuration](./configuration.md#health-contract).
