import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readData } from "./read-data";

const root = join(import.meta.dirname, "..");
const content = readData();
mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(join(root, "src/generated/content.json"), JSON.stringify(content, null, 2) + "\n");
console.log(`content.json : ${Object.keys(content.days).length} jours, ${Object.keys(content.pinned).length} dates incontournables`);
