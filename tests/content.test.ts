import { describe, expect, test } from "vitest";
import { listDays, loadContent, mergeContent, resolveDay, type ContentData } from "../src/content";
import type { Fact, PinnedFact } from "../src/types";

function pinnedFact(title: string, eventYear = 1789): PinnedFact {
  return {
    eventYear,
    title,
    short: `${title} : texte court.`,
    essential: "Essentiel.",
    context: "Contexte.",
    didYouKnow: "Anecdote.",
    invitation: "Invitation.",
    source: { name: "Exemple", url: "https://example.org/a" },
    scope: "France",
    theme: "Histoire",
  };
}

function fact(date: string, title: string, eventYear = 1945): Fact {
  return { ...pinnedFact(title, eventYear), date };
}

function data(overrides: Partial<ContentData> = {}): ContentData {
  return { launchDate: "2026-11-17", pinned: {}, days: {}, ...overrides };
}

describe("resolveDay", () => {
  test("un jour futur renvoie null", () => {
    const d = data({ days: { "2026-11-18": fact("2026-11-18", "Futur") } });
    expect(resolveDay("2026-11-18", "2026-11-17", d)).toBeNull();
  });

  test("un jour avant le lancement renvoie null", () => {
    const d = data({ days: { "2026-11-16": fact("2026-11-16", "Avant") } });
    expect(resolveDay("2026-11-16", "2026-11-17", d)).toBeNull();
  });

  test("le jour d'aujourd'hui avec un fait renvoie le DayView", () => {
    const f = fact("2026-11-17", "UNESCO");
    const view = resolveDay("2026-11-17", "2026-11-17", data({ days: { "2026-11-17": f } }));
    expect(view).toEqual({ date: "2026-11-17", fact: f, pinned: false, previous: [] });
  });

  test("une date incontournable sans fait propre prend le fait figé", () => {
    const p = pinnedFact("Prise de la Bastille");
    const d = data({ launchDate: "2026-07-01", pinned: { "07-14": p } });
    const view = resolveDay("2026-07-14", "2026-07-14", d);
    expect(view?.fact).toEqual(p);
    expect(view?.pinned).toBe(true);
  });

  test("un jour sans aucun fait renvoie null", () => {
    expect(resolveDay("2026-11-17", "2026-11-17", data())).toBeNull();
  });

  test("le 29 février d'une année non bissextile renvoie null", () => {
    const d = data({ launchDate: "2027-01-01", pinned: { "02-29": pinnedFact("Bissextile") } });
    expect(resolveDay("2027-02-29", "2027-12-31", d)).toBeNull();
  });

  test("previous liste les mêmes jour et mois des années passées", () => {
    const d = data({
      days: {
        "2026-11-17": fact("2026-11-17", "Un", 1945),
        "2027-11-17": fact("2027-11-17", "Deux", 1869),
      },
    });
    const view = resolveDay("2027-11-17", "2027-11-17", d);
    expect(view?.previous).toEqual([{ date: "2026-11-17", eventYear: 1945, title: "Un" }]);
  });
});

describe("listDays", () => {
  test("ne renvoie ni les jours futurs ni les jours sans fait", () => {
    const d = data({
      days: {
        "2026-11-17": fact("2026-11-17", "A"),
        "2026-11-19": fact("2026-11-19", "C"),
        "2026-11-20": fact("2026-11-20", "D"),
      },
    });
    expect(listDays("2026-11-19", d)).toEqual([
      { date: "2026-11-17", title: "A", pinned: false },
      { date: "2026-11-19", title: "C", pinned: false },
    ]);
  });

  test("marque comme incontournable une date dont le jour et le mois sont figés", () => {
    const d = data({
      launchDate: "2026-11-10",
      pinned: { "11-11": pinnedFact("Armistice", 1918) },
    });
    expect(listDays("2026-11-12", d)).toEqual([{ date: "2026-11-11", title: "Armistice", pinned: true }]);
  });
});

describe("mergeContent", () => {
  test("fusionne les fichiers mensuels", () => {
    const merged = mergeContent(
      { launchDate: "2026-11-17" },
      {},
      {
        "2026-11": { "2026-11-17": fact("2026-11-17", "A") },
        "2026-12": { "2026-12-01": fact("2026-12-01", "B") },
      },
    );
    expect(Object.keys(merged.days)).toEqual(["2026-11-17", "2026-12-01"]);
  });

  test("refuse une même date dans deux fichiers", () => {
    expect(() =>
      mergeContent(
        { launchDate: "2026-11-17" },
        {},
        {
          "2026-11": { "2026-11-17": fact("2026-11-17", "A") },
          "2026-11b": { "2026-11-17": fact("2026-11-17", "B") },
        },
      ),
    ).toThrow(/2026-11-17/);
  });
});

describe("loadContent", () => {
  test("charge la configuration du lancement", () => {
    expect(loadContent().launchDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
