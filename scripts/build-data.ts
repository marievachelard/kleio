import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mergeContent } from "../src/merge";

const root = join(import.meta.dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

const dayFiles: Record<string, Record<string, never>> = {};
for (const f of readdirSync(join(root, "data/days")).filter((n) => n.endsWith(".json"))) {
  dayFiles[f.replace(/\.json$/, "")] = read(`data/days/${f}`);
}

const content = mergeContent(read("data/config.json"), read("data/pinned.json"), dayFiles);
mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(join(root, "src/generated/content.json"), JSON.stringify(content, null, 2) + "\n");
console.log(`content.json : ${Object.keys(content.days).length} jours, ${Object.keys(content.pinned).length} dates incontournables`);
