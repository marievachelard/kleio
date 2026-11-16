import { describe, expect, test } from "vitest";
import { validateContent, validateFact } from "../src/validate";
import { checkUrl } from "../src/links";
import type { Fact, PinnedFact } from "../src/types";
import type { ContentData } from "../src/merge";

const base: PinnedFact = {
  eventYear: 1945,
  title: "Création de l'UNESCO",
  short: "37 pays signent à Londres l'acte fondateur de l'UNESCO.",
  essential: "À Londres, 37 pays adoptent l'acte constitutif.",
  context: "La conférence est organisée par le Royaume-Uni et la France.",
  didYouKnow: "Le texte fondateur évoque l'esprit des hommes.",
  invitation: "L'histoire complète se lit en quelques minutes.",
  source: { name: "unesco.org", url: "https://www.unesco.org/fr/history" },
  scope: "Monde",
  theme: "Institutions",
};
const fact = (over: Partial<Fact> = {}): Fact => ({ ...base, date: "2026-11-16", ...over });

const has = (errors: string[], needle: string) => errors.some((e) => e.includes(needle));

describe("validateFact", () => {
  test("un fait valide ne produit aucune erreur", () => {
    expect(validateFact(fact(), "2026-11-16")).toEqual([]);
  });

  test("signale un corps de notification de plus de 140 caractères", () => {
    expect(has(validateFact(fact({ short: "a".repeat(141) }), "2026-11-16"), "short")).toBe(true);
    expect(validateFact(fact({ short: "a".repeat(140) }), "2026-11-16")).toEqual([]);
  });

  test("exige une source en https", () => {
    const errors = validateFact(fact({ source: { name: "x", url: "http://exemple.org" } }), "2026-11-16");
    expect(has(errors, "source.url")).toBe(true);
  });

  test("refuse le point médian, le tiret long et « fun fact »", () => {
    expect(has(validateFact(fact({ essential: "A · B" }), "2026-11-16"), "·")).toBe(true);
    expect(has(validateFact(fact({ context: "A — B" }), "2026-11-16"), "—")).toBe(true);
    expect(has(validateFact(fact({ didYouKnow: "Un Fun Fact : ..." }), "2026-11-16"), "fun fact")).toBe(true);
  });

  test("signale une clé qui ne correspond pas à la date du fait", () => {
    expect(has(validateFact(fact({ date: "2026-11-17" }), "2026-11-16"), "clé")).toBe(true);
  });

  test("refuse une date inexistante", () => {
    expect(has(validateFact(fact({ date: "2027-02-29" }), "2027-02-29"), "date invalide")).toBe(true);
  });

  test("refuse un événement postérieur au jour d'envoi", () => {
    expect(has(validateFact(fact({ eventYear: 2030 }), "2026-11-16"), "eventYear")).toBe(true);
  });

  test("refuse une portée inconnue et un champ vide", () => {
    expect(has(validateFact({ ...fact(), scope: "Europe" as never }, "2026-11-16"), "scope")).toBe(true);
    expect(has(validateFact(fact({ title: " " }), "2026-11-16"), "title")).toBe(true);
  });

  test("un fait figé est identifié par MM-JJ, pas par une date complète", () => {
    expect(validateFact(base, "07-14")).toEqual([]);
    expect(has(validateFact(base, "13-45"), "clé")).toBe(true);
  });
});

describe("validateContent", () => {
  const data = (over: Partial<ContentData> = {}): ContentData => ({
    launchDate: "2026-11-16",
    pinned: {},
    days: {},
    ...over,
  });

  test("signale un doublon de titre pour une même date calendaire", () => {
    const d = data({
      days: {
        "2026-11-16": fact(),
        "2027-11-16": fact({ date: "2027-11-16" }),
      },
    });
    expect(has(validateContent(d), "doublon")).toBe(true);
  });

  test("des titres différents pour une même date sont acceptés", () => {
    const d = data({
      days: {
        "2026-11-16": fact(),
        "2027-11-16": fact({ date: "2027-11-16", title: "Autre événement" }),
      },
    });
    expect(validateContent(d)).toEqual([]);
  });

  test("signale une date de lancement invalide", () => {
    expect(has(validateContent(data({ launchDate: "demain" })), "launchDate")).toBe(true);
  });
});

describe("checkUrl", () => {
  const reply = (status: number) => async () => new Response(null, { status });

  test("accepte une réponse 200", async () => {
    expect(await checkUrl("https://exemple.org", reply(200))).toBeNull();
  });

  test("signale une erreur 404 avec le statut", async () => {
    expect(await checkUrl("https://exemple.org", reply(404))).toContain("404");
  });

  test("signale une erreur réseau", async () => {
    const boom = async () => {
      throw new Error("réseau");
    };
    expect(await checkUrl("https://exemple.org", boom)).toContain("réseau");
  });

  test("retente en GET quand HEAD est refusé (405)", async () => {
    const calls: string[] = [];
    const fetchFn = async (_u: string, init?: RequestInit) => {
      calls.push(init?.method ?? "GET");
      return new Response(null, { status: init?.method === "HEAD" ? 405 : 200 });
    };
    expect(await checkUrl("https://exemple.org", fetchFn)).toBeNull();
    expect(calls).toEqual(["HEAD", "GET"]);
  });
});
