# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Cathode is an Obsidian community plugin that provides an integrated terminal in editor tabs. It uses xterm.js and node-pty for full PTY emulation — interactive programs, tab completion, colors, and ncurses all work.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (rebuilds on save)
npm run build        # Production esbuild bundle
```

## Architecture

**Build pipeline:** TypeScript (`src/`) → esbuild → `main.js` (CommonJS). Obsidian modules are kept external (not bundled). xterm.css is inlined at build time.

**Source files (`src/`):**

- **main.ts** — Plugin lifecycle, registers view type, ribbon icon, and command palette entry.
- **terminal-view.ts** — ItemView subclass: xterm.js setup, resize handling, theme sync, keyboard isolation.
- **terminal-pty.ts** — node-pty wrapper with child_process fallback.
- **constants.ts** — View type ID, settings interface, defaults.

**Key patterns:**
- `isDesktopOnly: true` — requires Node/Electron APIs (node-pty)
- Terminal sessions open as regular editor tabs
- Theme adapts to Obsidian's dark/light mode using CSS variables
- Keyboard events are isolated so keys (Escape, Tab, etc.) stay in the terminal
- Command IDs are stable; never rename after release

## Versioning Convention

- **Semver**: patch for bug fixes, minor for new features/enhancements, major for breaking changes
- **Four files to bump together**: `package.json`, `manifest.json`, `package-lock.json`, `versions.json`
- **CHANGELOG.md**: update with each meaningful change using [Keep a Changelog](https://keepachangelog.com/) format (Added/Changed/Fixed/Removed sections)
- After meaningful commits, suggest appropriate semver bump level

### Files to Update on Version Bump

1. `package.json` — `version` field
2. `manifest.json` — `version` field
3. `package-lock.json` — top-level `version` and `packages[""].version`
4. `versions.json` — add `"<version>": "<minAppVersion>"` entry (currently `"1.5.0"`)

## Conventions

- Keep `main.ts` focused on plugin lifecycle; delegate features to separate modules
- Styles use Obsidian CSS variables (e.g., `--text-normal`, `--background-primary`) to match the native theme
