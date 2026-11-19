import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".cloudflare-assets");
const files = [
  "index.html",
  "app.js",
  "styles.css",
  "pack.js",
  "lexicon.js",
  "lexicon-extra.js",
  "lexicon-meta.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map((file) =>
  cp(path.join(root, file), path.join(output, file))
));

console.log(`Prepared ${files.length} static files in ${output}`);
