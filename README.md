# Cathode – A simple terminal for Obsidian

An integrated terminal plugin for [Obsidian](https://obsidian.md) that opens zsh sessions in editor tabs. Built with [xterm.js](https://xtermjs.org/) and [node-pty](https://github.com/nicandris/node-pty) for full PTY emulation — interactive programs, tab completion, colors, and ncurses all work.

**Desktop only.** Requires Obsidian on macOS, Linux, or Windows.

## Features

- Terminal sessions open as regular editor tabs (supports multiple simultaneous terminals)
- Full PTY emulation via node-pty (falls back to `child_process` if unavailable)
- Auto-resizes with the tab using ResizeObserver + xterm FitAddon
- Theme adapts to Obsidian's dark/light mode with high-contrast ANSI palettes
- Working directory defaults to vault root
- Keyboard isolation — all keys (including Escape, Backspace, Tab) stay in the terminal
- Clickable URLs via xterm WebLinksAddon

## Installation

This plugin is not yet in the Obsidian community plugin directory. To install manually:

```sh
cd /path/to/your-vault/.obsidian/plugins
git clone https://github.com/colemanm/obsidian-cathode.git cathode-terminal
cd cathode-terminal
npm install
npx @electron/rebuild -f -w node-pty -v 39.5.1   # match your Obsidian's Electron version
npm run build
```

Then enable **Cathode** in Obsidian Settings > Community Plugins.

## Usage

- Click the terminal icon in the ribbon, or
- Open the command palette and run **Cathode: Open terminal**, or
- Press `Ctrl + `` (default hotkey)

Each invocation opens a new terminal tab. Close the tab to kill the session.

## Development

```sh
git clone https://github.com/colemanm/obsidian-cathode.git
cd obsidian-cathode
npm install
npx @electron/rebuild -f -w node-pty -v 39.5.1
npm run dev          # watch mode
```

Symlink into your vault for testing:

```sh
ln -s /path/to/obsidian-cathode /path/to/vault/.obsidian/plugins/cathode-terminal
```

## Architecture

```
src/
  main.ts              # Plugin entry — registers view, ribbon icon, command
  terminal-view.ts     # ItemView subclass — xterm.js setup, resize, theme, keyboard
  terminal-pty.ts      # node-pty wrapper with child_process fallback
  constants.ts         # View type ID, settings interface, defaults
```

## License

MIT
