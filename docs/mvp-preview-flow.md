# MVP Preview Flow

The MVP deploy path uses a local filesystem deployer with one static HTTP server.

## What the deployer writes

Input:

- `slug`
- `path`
- `content`

Output location:

`.runtime/previews/<slug>/<path>`

For example:

`.runtime/previews/landing-page/index.html`

## URL formation

Default host and port:

- `DEPLOYER_HOST=127.0.0.1`
- `DEPLOYER_PORT=4310`

Preview URL format:

`http://127.0.0.1:4310/previews/<slug>/<path>`

`PREVIEW_BASE_URL` can override the URL prefix if needed.

## Slug lifecycle

Preview artifacts are persistent by slug.

- First deploy creates `.runtime/previews/<slug>/...`
- Redeploy with the same slug overwrites existing content
- URL remains stable for that slug/path pair

## Smoke test

Run:

```bash
vp run deployer:smoke
```

This deploys a sample HTML page and fetches its preview URL to verify end-to-end behavior.
