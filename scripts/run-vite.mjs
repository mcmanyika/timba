import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseNodeVersion(version) {
  const [major, minor] = version.slice(1).split(".").map(Number);
  return { major, minor };
}

function nodeMeetsRequirement(execPath) {
  const result = spawnSync(execPath, ["-p", "process.version"], { encoding: "utf8" });
  if (result.status !== 0) return false;
  const { major, minor } = parseNodeVersion(result.stdout.trim());
  return major > 20 || (major === 20 && minor >= 19) || major >= 22;
}

function resolveNodeBinary() {
  if (nodeMeetsRequirement(process.execPath)) return process.execPath;

  const candidates = [
    process.env.NODE_BINARY,
    "/opt/homebrew/opt/node@22/bin/node",
    "/usr/local/opt/node@22/bin/node",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate) && nodeMeetsRequirement(candidate)) return candidate;
  }

  return null;
}

const node = resolveNodeBinary();
if (!node) {
  console.error("\nThis project requires Node.js 20.19+ or 22.12+.");
  console.error(`Current: ${process.version}`);
  console.error("\nFix:");
  console.error("  nvm install 22 && nvm use");
  console.error("  # or: brew install node@22");
  console.error("  # then reinstall deps: rm -rf node_modules package-lock.json && npm install\n");
  process.exit(1);
}

const viteArgs = process.argv.slice(2);
const viteBin = join(root, "node_modules", "vite", "bin", "vite.js");
const result = spawnSync(node, [viteBin, ...viteArgs], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
