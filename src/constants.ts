export const VIEW_TYPE_TERMINAL = "terminal-console-view";

export interface ConsoleSettings {
  shell: string;
  cwd: string;
  fontSize: number;
  fontFamily: string;
}

export const DEFAULT_SETTINGS: ConsoleSettings = {
  shell: process.env.SHELL || "/bin/zsh",
  cwd: "",
  fontSize: 14,
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
};
