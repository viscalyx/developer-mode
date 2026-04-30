# Devcontainer

This folder defines the VS Code / GitHub Codespaces dev container
for `viscalyx/developer-mode`. It also works with OpenAI's Codex
CLI, which needs a Bubblewrap-capable sandbox.

## What it gives you

- Ubuntu 24.04 base with `git`, `curl`, `wget`, `sudo`, `zsh`,
  `build-essential`, `python3`, `bubblewrap`, and `ripgrep`.
- Node pinned to a fixed major version (`"version": "24"`) via the
  `ghcr.io/devcontainers/features/node:1` feature in
  `devcontainer.json`. The pin is intentionally hard-coded there
  rather than read from `.nvmrc`, so update both files together
  when bumping Node. `nvm` is also installed inside the container
  if you want to switch versions manually.
- GitHub CLI, oh-my-zsh, and the editor extensions used by this
  repo (Biome, markdownlint, Vitest, spell-checker, Copilot Chat,
  ChatGPT, mermaid).

## ⚠️ Elevated privileges

The `app` service in `docker-compose.yml` runs with:

- `cap_add: [SYS_ADMIN]`
- `security_opt: [seccomp=unconfined, systempaths=unconfined]`

This is required for OpenAI Codex's Bubblewrap-based sandbox to
mount a new `/proc` inside a child PID namespace
(`bwrap --unshare-pid`). Without it, sandbox-wrapped agent commands
fall back to unsandboxed execution.

There is no separate non-elevated profile in this compose file, so
"opt-in" effectively means **by attaching this devcontainer at
all**. Treat it accordingly:

- Only attach this devcontainer to repositories whose source you
  trust.
- Do not attach it to untrusted forks or pull requests without
  reviewing the diff first.
- Do not copy this elevated profile into a non-devcontainer
  `docker-compose.yml`.

`systempaths=unconfined` is only honored by reasonably recent
Docker Engine and Docker Desktop versions. On older Docker the
flag is ignored, `bwrap --unshare-pid` falls back to unsandboxed
execution, and Codex still works — just without the nested
sandbox.

## Codex CLI state

The compose file bind-mounts `${HOME}/.codex` from the host into
the container so your Codex CLI auth and session state are shared
with the host. Runtime temp wrappers live in the container-local
named volume `codex-tmp` to avoid polluting the host.

`${HOME}` is expanded by Docker Compose; it works under macOS,
Linux, WSL, and Git Bash on Windows. On Windows `cmd.exe` it does
not expand — use Git Bash, WSL, or set `HOME` explicitly before
launching the devcontainer.

## Usage

In VS Code with the **Dev Containers** extension installed, run
**Dev Containers: Reopen in Container** from the command palette.

In GitHub Codespaces, the configuration is picked up automatically.
