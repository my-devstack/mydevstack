# Upgrade

MyDevStack is a single Go binary + a static Vue bundle. No database, no schema, no data-volume migrations. Upgrade = swap the binary or pull a new image.

---

## Pre-flight

### 1. Note the current version

Docker:

```bash
docker compose -f examples/docker-compose/docker-compose-floci.yml ps --format json \
  | jq -r '.[] | select(.Service=="proxy") | .Image'
# beabys/mydevstack:v1.2.3
```

Or ask the running proxy:

```bash
curl -s http://localhost:8081/health | jq '{latestVersion, read_only_mode, region}'
```

`latestVersion` in the response is the newest GitHub release — useful to decide whether to upgrade at all.

### 2. Back up configuration

Nothing in the emulator is managed by MyDevStack, but your own config is worth keeping:

- `.env` (repo root) — port, region, emulator endpoint.
- `pkg/proxy/config.yaml` (if you use one via `CONFIG_FILE`).

No data volumes to back up — emulator state lives in its own container.

---

## Docker upgrade

### 1. Pull the new image (pinned tag — recommended)

```bash
VERSION=v1.3.0     # new tag
FILE=examples/docker-compose/docker-compose-floci.yml   # or -ministack / docker-compose.yml

docker compose -f "$FILE" pull
```

### 2. Recreate containers

```bash
docker compose -f "$FILE" up -d
```

Only the `proxy` image changes between releases; the emulator image is independent.

### 3. `:latest` caveat

`beabys/mydevstack:latest` is published on every release. Fine for local play, **do not use in production or CI** — an unexpected pull can jump major versions. Pin the tag in `docker-compose*.yml`:

```yaml
image: beabys/mydevstack:v1.3.0   # not :latest
```

### 4. Verify

```bash
curl -s http://localhost:8081/health | jq '{latestVersion, read_only_mode, status}'
# open http://localhost:3000 — UI should load
```

- HTTP **200** with `"status": "healthy"` = upgrade OK.
- HTTP **503** = proxy is up but the emulator (`:4566`) is unreachable. Not an upgrade failure — check the emulator container, not the proxy image.

Confirm `read_only_mode` matches your `.env`. If you did not set `READ_ONLY_MODE`, it must be `false`.

### 5. Rollback

Keep the previous tag around. To roll back:

```bash
VERSION=v1.2.3     # previous tag
docker compose -f "$FILE" pull proxy         # if you pinned via envsubst
# or edit the compose file back to the old tag, then:
docker compose -f "$FILE" up -d
```

---

## Binary upgrade

### 1. Stop the running service

systemd unit example:

```bash
sudo systemctl stop mydevstack-proxy
```

Plain shell (foreground or background):

```bash
pkill -f mydevstack-proxy     # or Ctrl-C if attached
```

### 2. Download the new asset + checksums

```bash
VERSION=v1.3.0
OS=darwin           # linux | darwin | windows
ARCH=arm64          # amd64 | arm64

curl -LO https://github.com/my-devstack/mydevstack/releases/download/${VERSION}/mydevstack-proxy-${OS}-${ARCH}.zip
curl -LO https://github.com/my-devstack/mydevstack/releases/download/${VERSION}/checksums.txt
```

### 3. Verify checksum

```bash
shasum -a 256 -c checksums.txt --ignore-missing
```

Exit code `0` and `OK` for your file = good. Mismatch = **do not run**, redownload.

### 4. Replace the binary

Keep a `.bak` for fast rollback:

```bash
sudo cp /usr/local/bin/mydevstack-proxy /usr/local/bin/mydevstack-proxy.bak
unzip -o mydevstack-proxy-${OS}-${ARCH}.zip
sudo install -m 0755 mydevstack-proxy /usr/local/bin/mydevstack-proxy
```

### 5. Restart + verify

```bash
sudo systemctl start mydevstack-proxy
sleep 2
curl -s http://localhost:8081/health | jq '{latestVersion, read_only_mode, status}'
```

- HTTP **200** with `"status": "healthy"` = upgrade OK.
- HTTP **503** = proxy started but emulator is unreachable. Not an upgrade failure — check the emulator.

### 6. Rollback

```bash
sudo systemctl stop mydevstack-proxy
sudo cp /usr/local/bin/mydevstack-proxy.bak /usr/local/bin/mydevstack-proxy
sudo systemctl start mydevstack-proxy
```

---

## Verify-after-upgrade checklist

Run in this order. If any step fails, stop and roll back.

| # | Check | Command | Pass criteria |
|---|-------|---------|---------------|
| 1 | Health returns 200 with `"status":"healthy"` | `curl -sf http://localhost:8081/health \| jq .status` | `"healthy"` (503 = emulator unreachable, not upgrade failure) |
| 2 | Version string matches release | `curl -s http://localhost:8081/health \| jq -r .latestVersion` | equals `$VERSION` |
| 3 | UI loads | open <http://localhost:3000> | page renders, no blank screen |
| 4 | Service list loads | UI → sidebar → S3 (or any service) | table renders, no error banner |
| 5 | One read smoke test | List S3 buckets via UI | list returns (even if empty) |
| 6 | One write smoke test | Create S3 bucket `upgrade-smoke-test` via UI | bucket appears in list |
| 7 | `read_only_mode` unchanged | `curl -s http://localhost:8081/health \| jq .read_only_mode` | matches your `.env` / config |

Clean up the smoke bucket:

```bash
# via UI (delete button), or via emulator directly:
aws --endpoint-url=http://localhost:4566 s3 rb s3://upgrade-smoke-test --force
```

---

## Zero-downtime note

MyDevStack is a single process. There is no clustered mode, no rolling deploy. Expect **brief downtime** during the swap — the proxy stops, the new one starts. Plan upgrades for a maintenance window if anything upstream depends on the proxy.

The emulator (`:4566`) is independent and stays up across proxy upgrades.
