# Cross-platform devcontainer base image
# Supports both AMD64 (Intel/AMD) and ARM64 (Apple Silicon)
# Includes: git, curl, wget, sudo, zsh, and the vscode user
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# cSpell:ignore bubblewrap
# Install system dependencies needed for npm native modules (node-gyp)
# and for the Codex CLI sandbox wrapper (`bwrap` is provided by the
# `bubblewrap` package). `ripgrep` is used by tooling and AI agents.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        bubblewrap \
        python3 \
        ripgrep && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /workspace

# Configure git for the workspace (security requirement)
RUN git config --system --add safe.directory /workspace

# Keep container running (remoteUser in devcontainer.json handles user switching)
CMD ["sleep", "infinity"]
