# agent-gui

Thin launcher app for running T3 Code as a remote-friendly web server.

## Scripts

- `vp run agent-gui#start` - Build and start T3 Code server
- `vp run agent-gui#start:remote` - One-go startup with auto-filled env values
- `vp run agent-gui#preflight` - Validate Bun, env, and connectivity prerequisites

## Required Environment

- `T3CODE_REPO_DIR` - absolute path to your local `pingdotgg/t3code` clone

## Optional Environment

- `BUN_BIN` - bun executable to use (default: `bun`)
- `T3CODE_PROJECT_ROOT` - project root used as process cwd for auto-bootstrapping (default: `/Users/erikwiberg/dev/codex`)
- `T3CODE_HOST` - host to bind to (defaults to Tailscale IPv4, then `127.0.0.1`)
- `T3CODE_PORT` - server port (default: `3773`)
- `T3CODE_AUTH_TOKEN` - auth token (generated automatically when omitted)
- `T3CODE_LOG_WS_EVENTS` - websocket push event logging (default: `1`)
- `T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD` - create/find project for server cwd on startup (default: `1`)

Notes:

- The launcher injects `VITE_WS_URL` during `bun run build` so remote web clients connect with the correct websocket URL.
- With auth enabled, `VITE_WS_URL` includes `?token=...`.
- Advanced troubleshooting only: set `T3CODE_DISABLE_AUTH=1` to run without websocket token auth.
