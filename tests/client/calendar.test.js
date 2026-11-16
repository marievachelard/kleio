// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderCalendar } from "../../public/app/views/calendar.js";

const item = (day, over = {}) => ({
  date: `2026-11-${String(day).padStart(2, "0")}`,
  title: `Fait ${day}`,
  pinned: false,
  eventYear: 1900 + day,
  short: `Texte court du ${day}.`,
  ...over,
});

const days = [9, 10, 11, 12, 13, 14, 15, 16].map((d) =>
  d === 11 ? item(d, { pinned: true, eventYear: 1918 }) : d === 16 ? item(d, { eventYear: 1945, short: "37 pays signent à Londres." }) : item(d),
);

const baseState = {
  monthIso: "2026-11",
  today: "2026-11-16",
  launchDate: "2026-11-09",
  days,
  selected: "2026-11-16",
};

function handlers() {
  return { onSelect: vi.fn(), onOpen: vi.fn(), onMonth: vi.fn() };
}

let root;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById("app");
});

const cell = (n) => root.querySelector(`[data-date="2026-11-${String(n).padStart(2, "0")}"]`);

describe("renderCalendar", () => {
  test("affiche le mois, l'année et l'en-tête Kleio", () => {
    renderCalendar(root, baseState, handlers());
    expect(root.querySelector(".nav")).toBeNull(); // le nom Kleio et la plume vivent dans l'en-tête permanent
    expect(root.querySelector(".mtitle .large").textContent).toBe("Novembre");
    expect(root.querySelector(".mtitle span").textContent).toBe("2026");
    expect(root.querySelector("a.back")).toBeNull();
  });

  test("la phrase d'accueil est la première ligne de l'écran, juste sous l'en-tête permanent", () => {
    renderCalendar(root, baseState, handlers());
    const tagline = root.querySelector(".tagline");
    expect(tagline.textContent).toBe("Chaque matin, un fait d'histoire.");
    expect(root.firstElementChild).toBe(tagline);
    expect(tagline.textContent).not.toMatch(/[·—]/);
  });

  test("il n'y a plus de lien « Réglages » en bas de page", () => {
    renderCalendar(root, baseState, handlers());
    expect(root.querySelector("a.settings")).toBeNull();
    expect(root.querySelector("main").textContent).not.toContain("Réglages");
  });

  test("novembre 2026 commence un dimanche : six cases vides avant le 1er", () => {
    renderCalendar(root, baseState, handlers());
    expect(root.querySelectorAll(".grid .blank")).toHaveLength(6);
    expect(root.querySelectorAll(".grid .c")).toHaveLength(30);
  });

  test("seuls les jours du 9 au 16 sont actifs", () => {
    renderCalendar(root, baseState, handlers());
    for (let d = 1; d <= 30; d++) {
      const disabled = cell(d).getAttribute("aria-disabled") === "true";
      expect(disabled, `jour ${d}`).toBe(d < 9 || d > 16);
    }
  });

  test("aujourd'hui est marqué, et la date incontournable porte une étoile", () => {
    renderCalendar(root, baseState, handlers());
    expect(cell(16).classList.contains("today")).toBe(true);
    expect(cell(11).classList.contains("star")).toBe(true);
    expect(cell(11).querySelector(".mark svg")).not.toBeNull();
    expect(cell(11).textContent).not.toContain("★");
    expect(cell(12).querySelector(".mark")).toBeNull();
  });

  test("l'étoile est un dessin centré : son centre horizontal est celui du dessin, jamais celui d'une police", () => {
    renderCalendar(root, baseState, handlers());
    const star = cell(11).querySelector(".mark svg");
    const [x0, , w] = star.getAttribute("viewBox").split(" ").map(Number);
    const xs = star.querySelector("polygon").getAttribute("points").split(" ").map((p) => Number(p.split(",")[0]));
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(x0 + w / 2, 2);
  });

  test("toucher un jour actif appelle onSelect, un jour grisé ne fait rien", () => {
    const h = handlers();
    renderCalendar(root, baseState, h);
    cell(12).click();
    expect(h.onSelect).toHaveBeenCalledWith("2026-11-12");
    cell(17).click();
    expect(h.onSelect).toHaveBeenCalledTimes(1);
  });

  test("la carte sous la grille montre le jour sélectionné avec l'année de l'événement", () => {
    renderCalendar(root, baseState, handlers());
    const card = root.querySelector(".pickcard");
    expect(card.querySelector("h4").textContent).toBe("16 novembre 1945");
    expect(card.querySelector("p").textContent).toBe("37 pays signent à Londres.");
  });

  test("le texte de la carte est un bloc repérable (« .pc »), pour pouvoir le faire glisser quand on change de jour", () => {
    renderCalendar(root, baseState, handlers());
    const pc = root.querySelector(".pickcard .pc");
    expect(pc).not.toBeNull();
    expect(pc.querySelector("h4").textContent).toBe("16 novembre 1945");
    expect(pc.querySelector("p")).not.toBeNull();
    expect(pc.querySelector(".go")).toBeNull();
  });

  test("toute la carte ouvre le détail du jour sélectionné, pas seulement la flèche", () => {
    const h = handlers();
    renderCalendar(root, baseState, h);
    const card = root.querySelector(".pickcard");
    expect(card.tagName).toBe("A");
    expect(card.getAttribute("href")).toBe("#/day/2026-11-16");
    card.querySelector("p").click();
    expect(h.onOpen).toHaveBeenCalledWith("2026-11-16");
    card.querySelector("h4").click();
    card.querySelector(".go").click();
    expect(h.onOpen).toHaveBeenCalledTimes(3);
  });

  test("la flèche de la carte n'est plus un bouton séparé : elle est décorative", () => {
    renderCalendar(root, baseState, handlers());
    const go = root.querySelector(".pickcard .go");
    expect(go.tagName).not.toBe("BUTTON");
    expect(go.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector(".pickcard button")).toBeNull();
  });

  test("lancement et aujourd'hui dans le même mois : les deux flèches de mois sont grisées", () => {
    const h = handlers();
    renderCalendar(root, baseState, h);
    const [prev, next] = root.querySelectorAll(".mnav button");
    expect(prev.getAttribute("aria-disabled")).toBe("true");
    expect(next.getAttribute("aria-disabled")).toBe("true");
    prev.click();
    next.click();
    expect(h.onMonth).not.toHaveBeenCalled();
  });

  test("avec un lancement en octobre, la flèche précédente est active", () => {
    const h = handlers();
    renderCalendar(root, { ...baseState, launchDate: "2026-10-20" }, h);
    const [prev, next] = root.querySelectorAll(".mnav button");
    expect(prev.getAttribute("aria-disabled")).not.toBe("true");
    expect(next.getAttribute("aria-disabled")).toBe("true");
    prev.click();
    expect(h.onMonth).toHaveBeenCalledWith(-1);
  });

  test("un glissement du doigt vers la gauche passe au mois suivant s'il est disponible", () => {
    const h = handlers();
    renderCalendar(root, { ...baseState, today: "2026-12-05" }, h);
    const grid = root.querySelector(".grid");
    const touch = (type, x) => {
      const ev = new Event(type, { bubbles: true });
      ev.changedTouches = [{ clientX: x, clientY: 100 }];
      ev.touches = type === "touchend" ? [] : [{ clientX: x, clientY: 100 }];
      grid.dispatchEvent(ev);
    };
    touch("touchstart", 220);
    touch("touchend", 100);
    expect(h.onMonth).toHaveBeenCalledWith(1);
  });

  test("un glissement vers un mois indisponible est ignoré", () => {
    const h = handlers();
    renderCalendar(root, baseState, h);
    const grid = root.querySelector(".grid");
    const touch = (type, x) => {
      const ev = new Event(type, { bubbles: true });
      ev.changedTouches = [{ clientX: x, clientY: 100 }];
      ev.touches = [{ clientX: x, clientY: 100 }];
      grid.dispatchEvent(ev);
    };
    touch("touchstart", 220);
    touch("touchend", 100);
    expect(h.onMonth).not.toHaveBeenCalled();
  });

  test("le texte du contenu n'est jamais interprété comme du HTML", () => {
    const evil = days.map((d) => (d.date === "2026-11-16" ? { ...d, short: "<img src=x onerror=alert(1)>" } : d));
    renderCalendar(root, { ...baseState, days: evil }, handlers());
    expect(root.querySelector("img")).toBeNull();
  });
});
