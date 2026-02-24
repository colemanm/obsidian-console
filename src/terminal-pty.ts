import { EventEmitter } from "events";
import * as path from "path";

interface IPty {
  onData: (callback: (data: string) => void) => { dispose: () => void };
  onExit: (callback: (e: { exitCode: number; signal?: number }) => void) => { dispose: () => void };
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: (signal?: string) => void;
  pid: number;
}

export class TerminalPty extends EventEmitter {
  private pty: IPty | null = null;
  private disposed = false;

  constructor(
    private shell: string,
    private cwd: string,
    private cols: number,
    private rows: number,
    private pluginDir: string,
  ) {
    super();
  }

  async spawn(): Promise<void> {
    try {
      // node-pty must be required via absolute path since Obsidian's
      // Electron renderer doesn't resolve from plugin node_modules
      const ptyPath = path.join(this.pluginDir, "node_modules", "node-pty");
      const nodePty = require(ptyPath);
      this.pty = nodePty.spawn(this.shell, [], {
        name: "xterm-256color",
        cols: this.cols,
        rows: this.rows,
        cwd: this.cwd,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          COLORTERM: "truecolor",
          LANG: process.env.LANG || "en_US.UTF-8",
          LC_ALL: process.env.LC_ALL || "en_US.UTF-8",
        },
      });

      this.pty!.onData((data: string) => {
        if (!this.disposed) this.emit("data", data);
      });

      this.pty!.onExit((e: { exitCode: number; signal?: number }) => {
        if (!this.disposed) this.emit("exit", e);
      });
    } catch (err) {
      console.error("node-pty failed, falling back to child_process:", err);
      await this.spawnFallback();
    }
  }

  private async spawnFallback(): Promise<void> {
    const { spawn } = require("child_process");
    const proc = spawn(this.shell, ["-i"], {
      cwd: this.cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
        LANG: process.env.LANG || "en_US.UTF-8",
        LC_ALL: process.env.LC_ALL || "en_US.UTF-8",
        COLUMNS: String(this.cols),
        LINES: String(this.rows),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      if (!this.disposed) this.emit("data", data.toString());
    });

    proc.stderr.on("data", (data: Buffer) => {
      if (!this.disposed) this.emit("data", data.toString());
    });

    proc.on("exit", (code: number | null, signal: string | null) => {
      if (!this.disposed) this.emit("exit", { exitCode: code ?? 0, signal });
    });

    // Shim the pty interface over child_process
    this.pty = {
      onData: (cb: (data: string) => void) => {
        proc.stdout.on("data", (d: Buffer) => cb(d.toString()));
        return { dispose: () => {} };
      },
      onExit: (cb: (e: { exitCode: number }) => void) => {
        proc.on("exit", (code: number) => cb({ exitCode: code ?? 0 }));
        return { dispose: () => {} };
      },
      write: (data: string) => proc.stdin.write(data),
      resize: () => {},
      kill: (signal?: string) => proc.kill(signal || "SIGTERM"),
      pid: proc.pid,
    };
  }

  write(data: string): void {
    this.pty?.write(data);
  }

  resize(cols: number, rows: number): void {
    this.pty?.resize(cols, rows);
  }

  kill(): void {
    this.disposed = true;
    try {
      this.pty?.kill();
    } catch {
      // Already dead
    }
    this.pty = null;
  }
}
