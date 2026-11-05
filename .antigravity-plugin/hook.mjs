import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.resolve(here, "hook.bundle.mjs");
process.argv[1] = bundle;
if (!process.argv.includes("--agent")) {
  process.argv.push("--agent", "antigravity-cli");
}
await import("./hook.bundle.mjs");
