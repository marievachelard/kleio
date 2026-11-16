import { h, svg } from "../dom.js";
import { addMonth, formatEventDate, monthName } from "../format.js";
import { header } from "./chrome.js";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const SVG_NS = "http://www.w3.org/2000/svg";
// Étoile à 5 branches dessinée (et non un caractère de police) : elle reste centrée quel que soit le téléphone.
const STAR_POINTS = "6.000,0.000 7.411,4.058 11.706,4.146 8.283,6.742 9.527,10.854 6.000,8.400 2.473,10.854 3.717,6.742 0.294,4.146 4.589,4.058";

function starIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 12 12");
  svg.setAttribute("aria-hidden", "true");
  const polygon = document.createElementNS(SVG_NS, "polygon");
  polygon.setAttribute("points", STAR_POINTS);
  polygon.setAttribute("fill", "currentColor");
  svg.append(polygon);
  return svg;
}

function chevron(direction) {
  return direction < 0
    ? svg("0 0 10 16", [9, 15], "M8 2L2 8l6 6", 2.2)
    : svg("0 0 10 16", [9, 15], "M2 2l6 6-6 6", 2.2);
}

/**
 * state : { monthIso, today, launchDate, days: [{date,title,pinned,eventYear,short}], selected }
 * handlers : { onSelect(date), onOpen(date), onMonth(delta) }
 */
export function renderCalendar(root, state, handlers) {
  const { monthIso, today, launchDate, days, selected } = state;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const prevEnabled = monthIso > launchDate.slice(0, 7);
  const nextEnabled = monthIso < today.slice(0, 7);

  const [year, month] = monthIso.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const blanks = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const monthButton = (delta, enabled, label) =>
    h(
      "button",
      {
        type: "button",
        "aria-label": label,
        "aria-disabled": enabled ? null : "true",
        class: enabled ? null : "dis",
        onclick: () => {
          if (enabled) handlers.onMonth(delta);
        },
      },
      chevron(delta),
    );

  const cells = [];
  for (const w of WEEKDAYS) cells.push(h("div", { class: "h" }, w));
  for (let i = 0; i < blanks; i++) cells.push(h("div", { class: "blank" }));
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${monthIso}-${String(d).padStart(2, "0")}`;
    const item = byDate.get(iso);
    const enabled = item !== undefined;
    const classes = ["c"];
    if (iso === today) classes.push("today");
    if (item && item.pinned) classes.push("star");
    if (iso === selected && iso !== today) classes.push("sel");
    cells.push(
      h(
        "button",
        {
          type: "button",
          class: classes.join(" "),
          "data-date": iso,
          "aria-disabled": enabled ? null : "true",
          "aria-label": item && item.pinned ? `${d}, incontournable` : String(d),
          onclick: () => {
            if (enabled) handlers.onSelect(iso);
          },
        },
        h("span", { class: "n" }, d),
        item && item.pinned ? h("span", { class: "mark", "aria-hidden": "true" }, starIcon()) : null,
      ),
    );
  }

  const grid = h("div", { class: "grid" }, cells);

  // Glissement horizontal : mois suivant ou précédent, seulement s'il est disponible.
  let start = null;
  grid.addEventListener("touchstart", (ev) => {
    const t = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]);
    start = t ? { x: t.clientX, y: t.clientY } : null;
  });
  grid.addEventListener("touchend", (ev) => {
    const t = ev.changedTouches && ev.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    start = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 60) return;
    if (dx < 0 && nextEnabled) handlers.onMonth(1);
    if (dx > 0 && prevEnabled) handlers.onMonth(-1);
  });

  const item = byDate.get(selected);
  let card = null;
  if (item && selected.slice(0, 7) === monthIso) {
    const [, m, d] = selected.split("-").map(Number);
    card = h(
      "a",
      {
        class: "group pickcard",
        href: `#/day/${selected}`,
        onclick: (ev) => {
          ev.preventDefault();
          handlers.onOpen(selected);
        },
      },
      h("div", { class: "pc" }, h("h4", null, formatEventDate(d, m, item.eventYear)), h("p", null, item.short)),
      h("span", { class: "go", "aria-hidden": "true" }, svg("0 0 12 12", [12, 12], "M2.5 9.5l7-7M3.5 2.5h6v6", 1.9)),
    );
  }

  root.replaceChildren(
    ...header({ tagline: "Chaque matin, un fait d'histoire." }).filter(Boolean),
    h(
      "main",
      { class: "pad" },
      h(
        "div",
        { class: "mhead" },
        h("div", { class: "mtitle" }, h("div", { class: "large" }, monthName(monthIso)), h("span", null, String(year))),
        h("div", { class: "mnav", role: "group", "aria-label": "Changer de mois" }, monthButton(-1, prevEnabled, "Mois précédent"), monthButton(1, nextEnabled, "Mois suivant")),
      ),
      grid,
      card,
    ),
  );
}
