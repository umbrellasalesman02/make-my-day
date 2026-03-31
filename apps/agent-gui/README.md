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
- `T3CODE_HOST` - host to bind to (defaults to Tailscale IPv4, then `127.0.0.1`)
- `T3CODE_PORT` - server port (default: `3773`)
- `T3CODE_AUTH_TOKEN` - auth token (generated automatically when omitted)
