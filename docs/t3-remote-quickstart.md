# T3 Remote Quickstart (Tailscale)

This quickstart launches T3 Code as a web app that can be opened from your phone over Tailscale.

## Fastest path (one command)

```bash
vp run agent-gui:remote
```

This command auto-sets host/port/token defaults and tries to infer `T3CODE_REPO_DIR` from common locations (`~/dev/t3code`, `~/code/t3code`, `~/src/t3code`).

If inference fails, set `T3CODE_REPO_DIR` and rerun.

## 1) Install prerequisites

```bash
vp install
bun --version
tailscale ip -4
```

Notes:

- This repo now includes `bun` as an `apps/agent-gui` dependency, so `vp install` will fetch it.
- If `bun --version` still fails, approve install scripts and reinstall:

```bash
vp pm approve-builds
vp install
```

- Global Bun still works too.
- `tailscale ip -4` must return a valid Tailnet IPv4.

## 2) Set environment

Copy `.env.example` into your shell environment:

```bash
export T3CODE_REPO_DIR="$HOME/dev/t3code"
export T3CODE_PORT=3773
export T3CODE_HOST="$(tailscale ip -4)"
export T3CODE_AUTH_TOKEN="$(openssl rand -hex 24)"
export BUN_BIN=bun
```

`T3CODE_HOST` can be omitted; the launcher auto-detects `tailscale ip -4` and falls back to `127.0.0.1`.
`BUN_BIN` can point to a specific Bun binary if needed.

## 3) Run preflight

```bash
vp run agent-gui#preflight
```

This validates Bun, `T3CODE_REPO_DIR`, and networking assumptions.

## 4) Start the remote server

```bash
vp run agent-gui:start
```

The launcher will run:

1. `bun run build`
2. `bun run --cwd apps/server start -- --host <host> --port <port> --auth-token <token> --no-browser`

## 5) Open from phone

Use the printed Tailnet URL:

`http://<tailnet-ip>:3773`

## Security notes

- Always use an auth token when binding outside localhost.
- Prefer binding to the Tailnet IP instead of `0.0.0.0` to reduce exposure.
- Treat the token as a password.
