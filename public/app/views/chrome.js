import { h, svg } from "../dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const GEAR_PATH =
  "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z";

const PLUME_PATHS = [
  "M472 62 C420 30 280 30 200 90 L145 132 L132 150 L130 230 L102 180 C70 220 50 290 66 374 C110 384 160 384 192 375 L152 334 L240 327 L332 262 L268 236 C310 229 345 226 362 210 L438 140 C460 110 470 85 472 62 Z",
  "M382 122 C410 124 435 118 455 108",
  "M245 82 C238 100 236 115 240 128",
  "M308 132 C230 190 120 280 75 365 C55 400 42 440 40 470",
];

/** Plume « Respiration » : trait de la couleur du texte, qui bouge très légèrement (voir styles.css). */
function plumeIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "plume");
  svg.setAttribute("viewBox", "0 0 512 512");
  svg.setAttribute("aria-hidden", "true");
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "plume__feather");
  for (const d of PLUME_PATHS) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    group.append(path);
  }
  svg.append(group);
  return svg;
}

function gearIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("aria-hidden", "true");
  for (const [tag, attrs] of [
    ["circle", { cx: "12", cy: "12", r: "3" }],
    ["path", { d: GEAR_PATH }],
  ]) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", "1.8");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-linejoin", "round");
    svg.append(el);
  }
  return svg;
}

/**
 * En-tête permanent : flèche de retour seule à gauche, « Kleio » et la plume au centre, icône de réglages à droite,
 * tous sur la même ligne. Il est créé UNE SEULE FOIS au démarrage, hors de la zone que les écrans remplacent :
 * la plume garde donc son mouvement quand on change de page. Seules la flèche et l'icône de réglages sont
 * affichées ou masquées selon l'écran (flèche sur les écrans de détail et de réglages, engrenage sur le calendrier).
 */
export function mountHeader(container) {
  const back = h(
    "a",
    { class: "back-link", href: "#/calendar", "aria-label": "Retour au calendrier", hidden: true },
    svg("0 0 10 16", [10, 16], "M8 2L2 8l6 6", 2.2),
  );
  const settings = h("a", { class: "settings-link", href: "#/setup", "aria-label": "Réglages", hidden: true }, gearIcon());
  container.replaceChildren(h("div", { class: "nav" }, back, h("span", { class: "brand" }, "Kleio", plumeIcon()), settings));
  return {
    showBack(visible) {
      back.hidden = !visible;
    },
    showSettings(visible) {
      settings.hidden = !visible;
    },
  };
}

/** Éléments propres à un écran, juste sous l'en-tête permanent : la phrase d'accueil du calendrier. */
export function header({ tagline = null } = {}) {
  return [tagline ? h("p", { class: "tagline" }, tagline) : null];
}
