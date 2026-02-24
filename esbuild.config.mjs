import esbuild from "esbuild";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

// Read xterm CSS to inline it
const xtermCssPath = join(__dirname, "node_modules/@xterm/xterm/css/xterm.css");
let xtermCss = "";
try {
  xtermCss = readFileSync(xtermCssPath, "utf8");
} catch {
  console.warn("Warning: xterm.css not found, will be empty until npm install");
}

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  target: "es2022",
  platform: "node",
  sourcemap: "inline",
  external: [
    "obsidian",
    "electron",
    "node-pty",
    "node:child_process",
    "node:os",
    "node:path",
    "node:fs",
    "node:process",
  ],
  define: {
    XTERM_CSS: JSON.stringify(xtermCss),
  },
  loader: {
    ".css": "text",
  },
  logLevel: "info",
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
}
