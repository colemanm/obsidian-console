export const VIEW_TYPE_TERMINAL = "terminal-cathode-view";

export interface CathodeSettings {
  shell: string;
  cwd: string;
  fontSize: number;
  fontFamily: string;
}

export const DEFAULT_SETTINGS: CathodeSettings = {
  shell: process.env.SHELL || "/bin/zsh",
  cwd: "",
  fontSize: 14,
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
};
