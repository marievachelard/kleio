// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from "vitest";
import { renderDetail, renderUnavailable } from "../../public/app/views/detail.js";

const fact = {
  eventYear: 1945,
  title: "Création de l'UNESCO",
  short: "37 pays signent à Londres l'acte fondateur.",
  essential: "À Londres, 37 pays adoptent l'acte constitutif de l'UNESCO.",
  context: "Premier paragraphe du contexte.\n\nSecond paragraphe du contexte.",
  didYouKnow: "Le texte fondateur évoque l'esprit des hommes.",
  invitation: "Une organisation née pour qu'on n'ait plus à refaire la guerre.",
  source: { name: "unesco.org", url: "https://www.unesco.org/fr/history" },
  scope: "Monde",
  theme: "Institutions",
};
const view = (over = {}) => ({ date: "2026-11-16", fact, pinned: false, previous: [], ...over });

let root;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById("app");
});

describe("renderDetail", () => {
  test("affiche le titre daté avec l'année de l'événement", () => {
    renderDetail(root, view());
    expect(root.querySelector("h1").textContent).toBe("16 novembre 1945");
  });

  test("les sections viennent dans l'ordre : essentiel, contexte, le saviez-vous", () => {
    renderDetail(root, view());
    const titles = [...root.querySelectorAll(".group h2")].map((h) => h.textContent);
    expect(titles).toEqual(["L'essentiel", "Le contexte", "Le saviez-vous"]);
  });

  test("le contexte est découpé en paragraphes", () => {
    renderDetail(root, view());
    const paragraphs = root.querySelectorAll(".group.context p");
    expect(paragraphs).toHaveLength(2);
  });

  test("la source est en bas : bloc d'invitation puis ligne « Source : »", () => {
    renderDetail(root, view());
    expect(root.querySelector(".more p").textContent).toContain("refaire la guerre");
    const button = root.querySelector(".more a.src");
    expect(button.textContent).toContain("Lire l'article");
    expect(button.getAttribute("href")).toBe("https://www.unesco.org/fr/history");
    const line = root.querySelector(".srcline");
    expect(line.textContent).toBe("Source : unesco.org");
    const link = line.querySelector("a");
    expect(link.getAttribute("href")).toBe("https://www.unesco.org/fr/history");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(root.lastElementChild.contains(line) || root.querySelector("main").lastElementChild === line).toBe(true);
  });

  test("l'étiquette Incontournable n'apparaît que pour une date figée", () => {
    renderDetail(root, view({ pinned: false }));
    expect(root.textContent).not.toContain("Incontournable");
    renderDetail(root, view({ pinned: true }));
    expect(root.querySelector(".chip.star").textContent).toBe("★ Incontournable");
  });

  test("les étiquettes de portée et de thème sont affichées", () => {
    renderDetail(root, view());
    const chips = [...root.querySelectorAll(".chip")].map((c) => c.textContent);
    expect(chips).toEqual(["Monde", "Institutions"]);
  });

  test("sans années précédentes, aucune section « Aussi un »", () => {
    renderDetail(root, view());
    expect(root.textContent).not.toContain("Aussi un");
  });

  test("avec des années précédentes, affiche « Aussi un 17 novembre » et des liens vers ces jours", () => {
    renderDetail(
      root,
      view({
        date: "2027-11-17",
        previous: [{ date: "2026-11-17", eventYear: 1945, title: "Création de l'UNESCO" }],
      }),
    );
    expect(root.querySelector(".previous h2").textContent).toBe("Aussi un 17 novembre");
    const link = root.querySelector(".previous a");
    expect(link.getAttribute("href")).toBe("#/day/2026-11-17");
    expect(link.textContent).toContain("1945");
  });

  test("l'en-tête affiche Kleio et un retour vers le calendrier", () => {
    renderDetail(root, view());
    expect(root.querySelector(".brand").textContent).toBe("Kleio");
    const back = root.querySelector("a.back");
    expect(back.textContent).toBe("‹ Calendrier");
    expect(back.getAttribute("href")).toBe("#/calendar");
  });

  test("le texte du contenu n'est jamais interprété comme du HTML", () => {
    renderDetail(root, view({ fact: { ...fact, title: "<img src=x onerror=alert(1)>", essential: "<b>gras</b>" } }));
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelector(".group b")).toBeNull();
    expect(root.textContent).toContain("<b>gras</b>");
  });
});

describe("renderUnavailable", () => {
  test("explique que le jour n'est pas disponible et propose le retour", () => {
    renderUnavailable(root);
    expect(root.textContent).toContain("Ce jour n'est pas encore disponible.");
    expect(root.querySelector("a.back").getAttribute("href")).toBe("#/calendar");
  });
});
