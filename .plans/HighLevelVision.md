# High Level Vision

## Problem

Today there is friction between idea → code → test:

- Requires a computer
- Requires many manual steps
- Hard to quickly try small ideas

## Goal

Build a personal, AI-driven coding ecosystem that:

- Provides a fast feedback loop (idea → running code in minutes)
- Is accessible from mobile
- Is code-driven (everything defined in repo)
- Evolves into a system that learns preferences

## Core Principles

### 1. Monorepo as “Operating System”

A single repo containing:

- Agent configs
- Deploy targets
- Scripts / tools / workflows
- (Future) recommendation system

Avoid fragmentation and multiple codebases

---

### 2. T3 Code as Primary Interface

T3 Code acts as:

- Web GUI (mobile via tunnel)
- Task-based agent interface

Handles:

- Threads (tasks)
- Git actions
- Agent execution

---

### 3. Multi-target Deployment

System should deploy to:

1. Local (Mac Mini)
   - Docker Compose
   - Preview via tunnel

2. Agent environments
   - Daytona or similar

3. Remote infra (future)
   - VPC / cloud

---

### 4. Agent as Toolbelt

Agent should:

- Create code
- Run scripts
- Deploy
- Use repo context

Skills are defined in repo

---

### 5. Future Direction

- Personalized recommendations
- System evolves with user preferences

---

## Mental Model

System ≈

"Local-first developer OS"

- "AI agent runtime"
- "Deploy pipeline"
