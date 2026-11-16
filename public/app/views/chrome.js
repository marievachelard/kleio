import { h } from "../dom.js";

/** En-tête commun : « Kleio » centré, puis éventuellement le retour vers le calendrier. */
export function header({ back = false } = {}) {
  return [
    h("div", { class: "nav" }, h("span", { class: "brand" }, "Kleio")),
    back ? h("a", { class: "back", href: "#/calendar" }, "‹ Calendrier") : null,
  ];
}
