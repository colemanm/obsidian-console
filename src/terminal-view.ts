import { ItemView, WorkspaceLeaf, Plugin } from "obsidian";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { VIEW_TYPE_TERMINAL, DEFAULT_SETTINGS } from "./constants";
import { TerminalPty } from "./terminal-pty";

declare const XTERM_CSS: string;

export class TerminalView extends ItemView {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private pty: TerminalPty | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private plugin: Plugin;
  private _escHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_TERMINAL;
  }

  getDisplayText(): string {
    return "Terminal";
  }

  getIcon(): string {
    return "terminal-square";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("console-terminal-container");

    // Inject xterm.css into document head if not already present
    if (!document.getElementById("console-xterm-css")) {
      this.styleEl = document.createElement("style");
      this.styleEl.id = "console-xterm-css";
      this.styleEl.textContent = XTERM_CSS;
      document.head.appendChild(this.styleEl);
    }

    // Create terminal wrapper
    const terminalEl = container.createDiv({ cls: "console-terminal" });

    // Init xterm.js
    this.terminal = new Terminal({
      fontSize: DEFAULT_SETTINGS.fontSize,
      fontFamily: DEFAULT_SETTINGS.fontFamily,
      cursorBlink: true,
      cursorStyle: "block",
      allowProposedApi: true,
      theme: this.buildTheme(),
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());

    this.terminal.open(terminalEl);

    // Stop keyboard events from bubbling to Obsidian (bubble phase only,
    // so xterm's own capture-phase handlers on its textarea fire first).
    const stopBubble = (e: Event) => {
      e.stopPropagation();
    };
    terminalEl.addEventListener("keydown", stopBubble, false);
    terminalEl.addEventListener("keyup", stopBubble, false);
    terminalEl.addEventListener("keypress", stopBubble, false);

    // Obsidian listens for Escape at the document capture phase.
    // Intercept it there, but only when the event comes from our terminal.
    // Window capture fires before document capture, so this runs
    // before Obsidian's Escape handler can see the event.
    this._escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && terminalEl.contains(e.target as Node)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", this._escHandler, true);

    // Also need to tell xterm to handle ALL keys (including ones it
    // might skip like backspace, tab, etc.)
    this.terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      // Let Cmd+C/V through for copy/paste at OS level
      if (e.metaKey && (e.key === "c" || e.key === "v")) {
        return false; // Let browser handle it
      }
      return true; // xterm handles everything else
    });

    // Focus terminal on click
    terminalEl.addEventListener("mousedown", () => {
      this.terminal?.focus();
    });

    // Delay spawn until container has proper layout and fonts are ready.
    // Use setTimeout to let Obsidian finish its layout pass.
    setTimeout(() => {
      this.fitAddon?.fit();
      this.terminal?.focus();
      this.spawnPty().then(() => {
        setTimeout(() => {
          this.fitAddon?.fit();
          if (this.terminal) {
            this.pty?.resize(this.terminal.cols, this.terminal.rows);
          }
        }, 100);
      });
    }, 50);

    // Resize on container size change
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.fitAddon?.fit();
        if (this.terminal) {
          this.pty?.resize(this.terminal.cols, this.terminal.rows);
        }
      });
    });
    this.resizeObserver.observe(terminalEl);

    // Watch for Obsidian dark/light theme changes
    this.themeObserver = new MutationObserver(() => {
      if (this.terminal) {
        this.terminal.options.theme = this.buildTheme();
      }
    });
    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Wire keyboard input to PTY
    this.terminal.onData((data) => {
      this.pty?.write(data);
    });
  }

  private async spawnPty(): Promise<void> {
    if (!this.terminal) return;

    // Default cwd to vault root
    const vaultPath = (this.app.vault.adapter as any).basePath || process.cwd();

    // Resolve plugin directory from vault path + manifest dir
    const vaultBase = (this.app.vault.adapter as any).basePath;
    const pluginDir = require("path").join(
      vaultBase,
      this.app.vault.configDir,
      "plugins",
      this.plugin.manifest.id,
    );
    // Follow symlink to get real path where node_modules lives
    const realPluginDir = require("fs").realpathSync(pluginDir);

    this.pty = new TerminalPty(
      DEFAULT_SETTINGS.shell,
      vaultPath,
      this.terminal.cols,
      this.terminal.rows,
      realPluginDir,
    );

    this.pty.on("data", (data: string) => {
      this.terminal?.write(data);
    });

    this.pty.on("exit", () => {
      this.terminal?.write("\r\n[Process exited]\r\n");
    });

    await this.pty.spawn();
  }

  private isDark(): boolean {
    return document.body.classList.contains("theme-dark");
  }

  private buildTheme(): Record<string, string> {
    const s = getComputedStyle(document.body);
    const bg = s.getPropertyValue("--background-primary").trim() || (this.isDark() ? "#1e1e1e" : "#ffffff");
    const fg = s.getPropertyValue("--text-normal").trim() || (this.isDark() ? "#d4d4d4" : "#1e1e1e");
    const accent = s.getPropertyValue("--text-accent").trim() || "#7aa2f7";
    const selection = s.getPropertyValue("--text-selection").trim() || (this.isDark() ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)");

    if (this.isDark()) {
      return {
        background: bg,
        foreground: fg,
        cursor: accent,
        selectionBackground: selection,
        black: "#1e1e2e",
        red: "#f38ba8",
        green: "#a6e3a1",
        yellow: "#f9e2af",
        blue: "#89b4fa",
        magenta: "#cba6f7",
        cyan: "#94e2d5",
        white: "#cdd6f4",
        brightBlack: "#585b70",
        brightRed: "#f38ba8",
        brightGreen: "#a6e3a1",
        brightYellow: "#f9e2af",
        brightBlue: "#89b4fa",
        brightMagenta: "#cba6f7",
        brightCyan: "#94e2d5",
        brightWhite: "#a6adc8",
      };
    } else {
      return {
        background: bg,
        foreground: fg,
        cursor: accent,
        selectionBackground: selection,
        black: "#4c4f69",
        red: "#a0153e",
        green: "#2e7d20",
        yellow: "#9a6700",
        blue: "#1558d6",
        magenta: "#6c2cb6",
        cyan: "#136d73",
        white: "#4c4f69",
        brightBlack: "#5c5f77",
        brightRed: "#d20f39",
        brightGreen: "#40a02b",
        brightYellow: "#b8860b",
        brightBlue: "#1e66f5",
        brightMagenta: "#8839ef",
        brightCyan: "#179299",
        brightWhite: "#3c3f57",
      };
    }
  }

  async onClose(): Promise<void> {
    this.pty?.kill();
    this.pty = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    if (this._escHandler) {
      window.removeEventListener("keydown", this._escHandler, true);
      this._escHandler = null;
    }
    this.terminal?.dispose();
    this.terminal = null;
    this.fitAddon = null;
  }
}
