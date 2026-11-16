import { h } from "../dom.js";

/** En-tête commun : « Kleio » centré, puis éventuellement le retour vers le calendrier. */
export function header({ back = false, tagline = null } = {}) {
  return [
    h("div", { class: "nav" }, h("span", { class: "brand" }, "Kleio")),
    tagline ? h("p", { class: "tagline" }, tagline) : null,
    back ? h("a", { class: "back", href: "#/calendar" }, "‹ Calendrier") : null,
  ];
}
