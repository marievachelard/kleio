import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const root = join(import.meta.dirname, "..");
const svg = readFileSync(join(root, "assets/logo.svg"), "utf8");
mkdirSync(join(root, "public/icons"), { recursive: true });

for (const size of [180, 192, 512]) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(join(root, `public/icons/icon-${size}.png`), png);
  console.log(`icon-${size}.png`);
}
