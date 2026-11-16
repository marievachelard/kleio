// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mountHeader } from "../../public/app/views/chrome.js";
import { renderCalendar } from "../../public/app/views/calendar.js";
import { renderDetail } from "../../public/app/views/detail.js";
import { renderSetup } from "../../public/app/views/setup.js";

let headerBox;
let root;
beforeEach(() => {
  document.body.innerHTML = '<header id="app-header"></header><div id="app"></div>';
  headerBox = document.getElementById("app-header");
  root = document.getElementById("app");
});

describe("mountHeader", () => {
  test("le nom Kleio est suivi, à droite, de la petite plume animée, dans le même groupe", () => {
    mountHeader(headerBox);
    const brand = headerBox.querySelector(".nav .brand");
    const plume = brand.querySelector("svg.plume");
    expect(brand.textContent).toBe("Kleio");
    expect(plume).not.toBeNull();
    expect(plume.getAttribute("aria-hidden")).toBe("true");
    expect(plume.querySelectorAll("path")).toHaveLength(4);
    expect(plume.querySelector("g.plume__feather")).not.toBeNull();
    expect(plume.previousSibling.textContent).toBe("Kleio");
    expect(plume.nextSibling).toBeNull();
  });

  test("l'icône de réglages existe, masquée par défaut, et s'affiche sur demande", () => {
    const header = mountHeader(headerBox);
    const settings = headerBox.querySelector("a.settings-link");
    expect(settings.getAttribute("href")).toBe("#/setup");
    expect(settings.getAttribute("aria-label")).toBe("Réglages");
    expect(settings.querySelector("svg")).not.toBeNull();
    expect(settings.hidden).toBe(true);
    header.showSettings(true);
    expect(settings.hidden).toBe(false);
    header.showSettings(false);
    expect(settings.hidden).toBe(true);
  });

  test("la flèche de retour est seule, à gauche : masquée par défaut, sans le mot « Calendrier », et s'affiche sur demande", () => {
    const header = mountHeader(headerBox);
    const back = headerBox.querySelector("a.back-link");
    expect(back.getAttribute("href")).toBe("#/calendar");
    expect(back.getAttribute("aria-label")).toBe("Retour au calendrier");
    expect(back.querySelector("svg")).not.toBeNull();
    expect(back.textContent.trim()).toBe("");
    expect(back.hidden).toBe(true);
    header.showBack(true);
    expect(back.hidden).toBe(false);
    header.showBack(false);
    expect(back.hidden).toBe(true);
  });

  test("la flèche de retour, le nom et les réglages sont sur la même ligne (le même bloc .nav)", () => {
    mountHeader(headerBox);
    const nav = headerBox.querySelector(".nav");
    expect(nav.querySelector("a.back-link")).not.toBeNull();
    expect(nav.querySelector(".brand")).not.toBeNull();
    expect(nav.querySelector("a.settings-link")).not.toBeNull();
  });

  test("changer d'écran ne recrée pas l'en-tête : la plume reste le même élément, son mouvement ne repart pas de zéro", () => {
    mountHeader(headerBox);
    const plume = headerBox.querySelector(".plume");
    const brand = headerBox.querySelector(".brand");

    const handlers = { onSelect: vi.fn(), onOpen: vi.fn(), onMonth: vi.fn() };
    const state = { monthIso: "2026-11", today: "2026-11-16", launchDate: "2026-11-09", days: [], selected: "2026-11-16" };
    const fact = {
      eventYear: 1945, title: "T", short: "s", essential: "e", context: "c", didYouKnow: "d", invitation: "i",
      source: { name: "x.org", url: "https://x.org" }, scope: "Monde", theme: "Institutions",
    };

    renderCalendar(root, state, handlers);
    renderDetail(root, { date: "2026-11-16", fact, pinned: false, previous: [] });
    renderSetup(root, { standalone: true, status: null, enabledBefore: false }, { onEnable: vi.fn(), onTest: vi.fn() });
    renderCalendar(root, state, handlers);

    expect(headerBox.querySelector(".plume")).toBe(plume);
    expect(headerBox.querySelector(".brand")).toBe(brand);
    expect(plume.isConnected).toBe(true);
    expect(root.querySelector(".brand")).toBeNull();
  });
});
