import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const pub = join(import.meta.dirname, "..", "public");
const read = (p: string) => readFileSync(join(pub, p), "utf8");

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("manifeste", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));

  test("déclare une app autonome nommée Kleio", () => {
    expect(manifest.name).toBe("Kleio");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
  });

  test("référence des icônes 192 et 512 qui existent", () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of manifest.icons) {
      expect(existsSync(join(pub, icon.src))).toBe(true);
    }
  });
});

describe("icônes", () => {
  test.each([180, 192, 512])("icon-%i.png est un PNG carré de la bonne taille", (n) => {
    expect(pngSize(join(pub, "icons", `icon-${n}.png`))).toEqual({ width: n, height: n });
  });
});

describe("page d'accueil", () => {
  const html = read("index.html");
  test("lie le manifeste et l'icône iOS", () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain("viewport-fit=cover");
  });
});

describe("service worker", () => {
  const sw = read("sw.js");
  test("gère push et le toucher sur la notification", () => {
    expect(sw).toContain('addEventListener("push"');
    expect(sw).toContain('addEventListener("notificationclick"');
  });
  test("ne pré-charge aucun jour : pas de addAll ni de liste de jours", () => {
    expect(sw).not.toContain("addAll");
    expect(sw).not.toMatch(/["']\/api\/day\/\d/);
  });
});
