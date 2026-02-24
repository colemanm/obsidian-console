import { Plugin } from "obsidian";
import { VIEW_TYPE_TERMINAL } from "./constants";
import { TerminalView } from "./terminal-view";

export default class ConsolePlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_TERMINAL, (leaf) => new TerminalView(leaf, this));

    // Ribbon icon
    this.addRibbonIcon("terminal-square", "Open terminal", () => {
      this.openTerminal();
    });

    // Command palette
    this.addCommand({
      id: "open-terminal",
      name: "Open terminal",
      hotkeys: [{ modifiers: ["Ctrl"], key: "`" }],
      callback: () => {
        this.openTerminal();
      },
    });
  }

  async openTerminal(): Promise<void> {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: VIEW_TYPE_TERMINAL,
      active: true,
    });
    this.app.workspace.revealLeaf(leaf);
  }

  async onunload(): Promise<void> {
    // Close all terminal views
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TERMINAL);
  }
}
