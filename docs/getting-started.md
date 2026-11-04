# Getting Started

MyDevStack runs three things:

- Go proxy (default port **8081**) — talks to AWS emulator.
- Vue UI (port **3000**) — browser GUI.
- AWS emulator (port **4566**) — LocalStack / Floci / MiniStack.

Pick one path below.

## Prerequisites

**Docker path**
- Docker Engine + Docker Compose v2.

**Binary path**
- Nothing beyond the OS. Download the prebuilt proxy + run the UI via the prebuilt Vue dist, or hit the proxy directly.

**Source path**
- Go 1.26+
- Node 24 + pnpm
- A running emulator on `:4566` (LocalStack, Floci, or MiniStack).

---

## Path A — Docker Compose (recommended)

Three compose variants live in `examples/docker-compose/`:

| File | Emulator | Use when |
|------|----------|----------|
| `docker-compose.yml` | None (bring your own on `:4566`) | You already run LocalStack/Floci elsewhere. |
| `docker-compose-floci.yml` | Floci (with OpenSearch + MSK mocks) | Default for most users. |
| `docker-compose-ministack.yml` | MiniStack | You prefer MiniStack. |

All commands run from the repo root.

### 1. Start the stack

```bash
# Floci (self-contained, recommended):
make compose-up-floci

# MiniStack:
make compose-up-ministack

# Bring-your-own emulator (must already be listening on :4566):
make compose-up
```

Each wraps `docker compose -f examples/docker-compose/<file> up -d`.

### 2. Wait ~10s, then verify

```bash
curl -s http://localhost:8081/health | jq
```

Expected:

```json
{
  "status": "healthy",
  "emulator": "FLOCI",
  "endpoint_url": "http://localhost:4566",
  "target": "http://localhost:4566",
  "region": "us-east-1",
  "read_only_mode": false,
  "latestVersion": "1.16.0",
  "proxy": "aws-proxy",
  "github_repo": "https://github.com/my-devstack/mydevstack"
}
```

Open the UI at <http://localhost:3000>.

### 3. Do something in 30 seconds

1. Open <http://localhost:3000> → sidebar → **S3**.
2. Click **Create Bucket**, name it `demo`, submit.
3. Bucket appears in the table. Click it → object list (empty).

That confirms UI ↔ proxy ↔ emulator path works end to end.

---

## Path B — Prebuilt binary

Binary releases live at <https://github.com/my-devstack/mydevstack/releases> (tag `v*`).

### 1. Download + verify

```bash
VERSION=v1.2.3                        # pick a real tag
OS=darwin                              # linux | darwin | windows
ARCH=arm64                             # amd64 | arm64

curl -LO https://github.com/my-devstack/mydevstack/releases/download/${VERSION}/mydevstack-proxy-${OS}-${ARCH}.zip
curl -LO https://github.com/my-devstack/mydevstack/releases/download/${VERSION}/checksums.txt

shasum -a 256 -c checksums.txt --ignore-missing
```

`checksums.txt` covers all released assets. `--ignore-missing` lets you verify only the one you downloaded.

### 2. Unpack + run

```bash
unzip mydevstack-proxy-${OS}-${ARCH}.zip
chmod +x mydevstack-proxy

export AWS_ENDPOINT=http://localhost:4566
export AWS_ACCESS_KEY=test
export AWS_SECRET_KEY=test
# Optional: PROXY_PORT=8081  READ_ONLY_MODE=false  EMULATOR=localstack

./mydevstack-proxy
```

The binary serves the proxy on `:8081` (or `$PROXY_PORT`). The Vue UI is not bundled with the binary — either run the UI from source (Path C) or use Docker.

### 3. Verify

```bash
curl -s http://localhost:8081/health | jq .status
# "healthy"
```

---

## Path C — From source

### 1. Configure env

```bash
cp .env.example .env
# edit .env if you need non-default ports or region
```

The Makefile reads `.env` automatically.

### 2. Start an emulator

Pick one (must listen on `:4566`):

```bash
# LocalStack:
docker run --rm -it -p 4566:4566 localstack/localstack

# Floci:
docker run --rm -it -p 4566:4566 \
  -e FLOCI_SERVICES_OPENSEARCH_MOCK=true \
  -e FLOCI_SERVICES_MSK_MOCK=true \
  beabys/floci:latest

# MiniStack:
docker run --rm -it -p 4566:4566 beabys/ministack:latest
```

### 3. Start proxy + UI

Makefile way (two terminals):

```bash
# terminal 1
make run-proxy        # Go on :8081 (auto `go mod tidy`)

# terminal 2
make run-ui           # Vue on :3000 (auto `pnpm install`)
```

Manual way (same, but explicit):

```bash
# terminal 1
go run ./pkg/proxy/cmd/server

# terminal 2
cd pkg/ui && pnpm install && pnpm run dev
```

### 4. Verify

```bash
curl -s http://localhost:8081/health | jq .status   # "healthy"
# open http://localhost:3000
```

---

## Stop / clean up

### Compose

```bash
make compose-down     # stops whichever variant is running
```

To also remove volumes (kills emulator state):

```bash
docker compose -f examples/docker-compose/docker-compose-floci.yml down -v
```

### Kill ports manually (source / binary paths)

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
```

Leave the emulator (`:4566`) alone unless you want to wipe its data too.

---

## Next steps

- [Configuration](configuration.md) — env vars, `config.yaml`, read-only mode, region switch.
- [Upgrade](upgrade.md) — move to a newer release, binary + Docker flows.
- [Compose examples README](../examples/docker-compose/README.md) — per-variant details, volume mounts, how to swap emulator.
- [Development](development.md) — running tests, mocks, E2E.
- [Troubleshooting](troubleshooting.md) — common failure modes.
