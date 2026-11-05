import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

process.argv.push("--agent", "antigravity-cli");
const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.resolve(here, "server.bundle.mjs"),
  path.resolve(here, "../release-out/server.mjs"),
];
const target = candidates.find((p) => existsSync(p)) ?? candidates[0];
await import(pathToFileURL(target).href);
