# Agent Instructions

Generic rules for all AI coding agents working in this repository.
Agent-specific files (`CLAUDE.md`, `.cursorrules`, etc.) extend these rules — they do not override them.

---

## Project Overview

**git-extract** is a web tool for extracting a git subdirectory (with its full history) into a
separate repository. Users authenticate with GitHub or GitLab, pick a source folder via a tree
view, choose a target repo, and the tool runs `git filter-repo` inside a GitHub Actions workflow
to rewrite and push the history.

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Quasar CLI + Vite, Vue 3 Composition API, Pinia |
| Frontend hosting | Cloudflare Pages |
| Backend | Cloudflare Worker (itty-router) |
| Auth — GitHub | OAuth App, token exchange in Worker |
| Auth — GitLab | PKCE in browser, no Worker involved |
| Git operations | GitHub Actions workflow in this repo (`extract.yml`) |
| Secret encryption | tweetnacl (libsodium box) inside the Worker |
| Monorepo | npm workspaces |

### Monorepo layout

```
git-extract/
├── AGENTS.md               ← you are here
├── CLAUDE.md               ← Claude Code specific extensions
├── .github/workflows/
│   ├── ci.yml              ← lint + build on PR
│   └── extract.yml         ← the git extraction runner (permanent, never touched at runtime)
├── frontend/               ← Quasar SPA
│   └── src/
│       ├── boot/           ← fetch wrapper (api.js)
│       ├── components/     ← ProviderLogin, RepoList, FolderTree, StatusPoller
│       ├── layouts/        ← MainLayout
│       ├── pages/          ← LoginPage, ReposPage, ExtractPage
│       ├── router/
│       ├── services/       ← github.js, gitlab.js
│       └── stores/         ← auth.js, repos.js (Pinia)
└── worker/                 ← Cloudflare Worker
    └── src/
        ├── routes/         ← auth.js, extract.js, status.js
        └── services/       ← crypto.js, actionsOrchestrator.js
```

### Dev commands

```bash
npm install                 # install all workspaces from root
npm run dev:frontend        # Quasar dev server → http://localhost:9000
npm run dev:worker          # Wrangler dev  → http://localhost:8787
npm run build               # build both workspaces
```

---

## Coding Rules

### General
- Match the style of the file you are editing. Do not reformat unrelated code.
- Do not add comments that describe *what* the code does — only add them when the *why* is
  non-obvious (hidden constraint, workaround, subtle invariant).
- Do not introduce abstractions beyond what the current task requires.
- Do not add error handling for scenarios that cannot happen in the current call context.
- Prefer editing existing files over creating new ones.

### Frontend (`frontend/`)
- Vue 3 Composition API only — no Options API.
- Use Quasar components (`QBtn`, `QTree`, `QCard`, etc.) instead of plain HTML where a
  Quasar equivalent exists.
- State lives in Pinia stores. Components do not hold cross-page state.
- API calls go through `src/services/github.js` or `src/services/gitlab.js` — not directly
  in components or stores.

### Worker (`worker/`)
- All routes are pure functions: `(request, env) => Response`.
- Secrets (`env.GH_SERVICE_PAT`, `env.GITHUB_CLIENT_SECRET`) must never appear in
  responses or logs.
- CORS origin must be validated against `env.SPA_URL` — never use `Access-Control-Allow-Origin: *`.

### GitHub Actions (`extract.yml`)
- The workflow file is static — the Worker dispatches it but never modifies it at runtime.
- Do not add steps that write to the `git-extract` repository itself during a run.

---

## Commit Rules

- Write commit messages in the imperative mood: `add X`, `fix Y`, `refactor Z`.
- Scope to the workspace when relevant: `frontend: add FolderTree component`.
- **Do not append `Co-Authored-By` lines attributing any AI tool or agent.**
  Commits are authored by the human developer. Agent contributions are invisible by design.
- Do not reference issue numbers in commit message bodies unless the user explicitly asks.

---

## What Requires User Confirmation

Always pause and confirm before:
- Any `git push --force` or history-rewriting operation.
- Deleting files or directories.
- Changing `wrangler.toml` production vars or deploying to Cloudflare.
- Adding new npm dependencies (confirm the package name and reason first).
