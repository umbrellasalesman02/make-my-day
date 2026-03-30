# MVP Vertical Slice

## Purpose

Prove the full loop works:

Prompt → Code → Deploy → Preview

---

## Use Case

From mobile via T3 Code:

"Create a simple HTML page and deploy it locally"

System should:

1. Generate code
2. Save to repo
3. Deploy locally
4. Return preview link

---

## Scope

### Included

- Monorepo (minimal)
- T3 Code integration
- One deploy target: local
- One workflow: create-and-deploy-html

### Excluded

- Multi-cloud
- Daytona
- Auth
- Recommendations

---

## Architecture

### Monorepo

repo/
apps/
preview-server/
tools/
deploy-local/
agent/
workflows/
docker/
docker-compose.yml

---

### T3 Code

- Runs locally
- Exposed via tunnel
- Accessed from mobile

---

### Workflow

Input:
"Create HTML page"

Steps:

1. Generate index.html
2. Save in repo
3. Run deploy script

---

### Deploy

Option A:

- Node static server

Option B:

- Docker container

Output:

- Local + public URL

---

## Definition of Done

- From mobile:
  - Send prompt
  - Get HTML page
  - Open preview link

---

## Design Choices

### Code-first

All logic in repo

### Minimal magic

Prefer explicit scripts

### One slice only

Focus on proving loop

---

## Next Steps

1. More deploy targets
2. Standardized skills
3. Persistent environments
4. Recommendation system

---

## TLDR

Prove:

Idea → Running code → Preview

via mobile + agent
