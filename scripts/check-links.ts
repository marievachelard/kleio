import { execFileSync } from "node:child_process";
import { checkUrl } from "../src/links";
import { readData } from "./read-data";

// Usage : npm run check-links [-- --changed-since <réf git>]
const idx = process.argv.indexOf("--changed-since");
const ref = idx >= 0 ? process.argv[idx + 1] : null;

const data = readData();
let urls = new Set<string>();
const all = [...Object.values(data.pinned), ...Object.values(data.days)];

if (ref) {
  const changed = execFileSync("git", ["diff", "--name-only", ref, "--", "data/"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const touchesPinned = changed.includes("data/pinned.json");
  const months = changed.map((f) => /data\/days\/(.+)\.json$/.exec(f)?.[1]).filter(Boolean) as string[];
  for (const [md, f] of Object.entries(data.pinned)) if (touchesPinned && md) urls.add(f.source.url);
  for (const [date, f] of Object.entries(data.days)) if (months.some((m) => date.startsWith(m))) urls.add(f.source.url);
} else {
  urls = new Set(all.map((f) => f.source.url));
}

const failures: string[] = [];
for (const url of urls) {
  const err = await checkUrl(url);
  if (err) failures.push(err);
}
if (failures.length > 0) {
  console.error(failures.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`${urls.size} lien(s) vérifié(s).`);
