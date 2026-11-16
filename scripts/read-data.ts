import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { mergeContent, type ContentData } from "../src/merge";
import type { Fact } from "../src/types";

const root = join(import.meta.dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

export function readData(): ContentData {
  const dayFiles: Record<string, Record<string, Fact>> = {};
  for (const f of readdirSync(join(root, "data/days")).filter((n) => n.endsWith(".json"))) {
    dayFiles[f.replace(/\.json$/, "")] = read(`data/days/${f}`);
  }
  return mergeContent(read("data/config.json"), read("data/pinned.json"), dayFiles);
}
