# Docker Compose Examples

Pre-built compose stacks for running MyDevStack with an AWS emulator.

## Files

| File | Description |
|------|-------------|
| `docker-compose.yml` | MyDevStack only — point `AWS_ENDPOINT` at an emulator you already run on `:4566` |
| `docker-compose-floci.yml` | FloCi + Mailpit + MyDevStack (self-contained) |
| `docker-compose-ministack.yml` | MiniStack + Redis + MyDevStack (self-contained) |

## Usage

```bash
# Default stack (MyDevStack only — emulator must already run on :4566)
docker compose -f examples/docker-compose/docker-compose.yml up -d

# FloCi-flavored stack
docker compose -f examples/docker-compose/docker-compose-floci.yml up -d

# MiniStack-flavored stack
docker compose -f examples/docker-compose/docker-compose-ministack.yml up -d

# Tear down
docker compose -f examples/docker-compose/docker-compose.yml down
```

Or use the Makefile wrappers: `make compose-up`, `make compose-up-floci`, `make compose-up-ministack`, `make compose-down`.

## Ports

- `3000` — Vue UI
- `8081` — Go proxy backend
- `4566` — AWS emulator

## `.env` placement caveat

`docker compose` loads `.env` from the **current working directory**, not from the compose file's directory. Run the commands above from the repo root (where `.env` lives), or set `--env-file .env` explicitly. Copy the template first:

```bash
cp .env.example .env
```

## Next steps

Full quickstart: [`docs/getting-started.md`](../../docs/getting-started.md).
