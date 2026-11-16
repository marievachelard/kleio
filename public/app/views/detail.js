import { h } from "../dom.js";
import { formatDayTitle, formatEventDate } from "../format.js";
import { header } from "./chrome.js";

function group(title, extraClass, ...body) {
  return h("section", { class: `group ${extraClass}`.trim() }, h("h2", null, title), ...body);
}

export function renderDetail(root, view) {
  const { fact } = view;
  const [, month, day] = view.date.split("-").map(Number);
  const rel = "noopener noreferrer";

  const chips = [
    h("span", { class: "chip" }, fact.scope),
    h("span", { class: "chip" }, fact.theme),
    view.pinned ? h("span", { class: "chip star" }, "★ Incontournable") : null,
  ];

  const previous =
    view.previous && view.previous.length > 0
      ? h(
          "section",
          { class: "group previous" },
          h("h2", null, `Aussi un ${formatDayTitle(view.date)}`),
          view.previous.map((p) =>
            h("a", { class: "year", href: `#/day/${p.date}` }, h("b", null, p.eventYear), h("span", null, p.title)),
          ),
        )
      : null;

  const main = h(
    "main",
    { class: "pad" },
    h("h1", { class: "large" }, formatEventDate(day, month, fact.eventYear)),
    h("div", { class: "chips" }, chips),
    group("L'essentiel", "", h("p", null, fact.essential)),
    group("Le contexte", "context", fact.context.split(/\n\s*\n/).map((p) => h("p", null, p))),
    group("Le saviez-vous", "fun", h("p", null, fact.didYouKnow)),
    h(
      "div",
      { class: "more" },
      h("p", null, fact.invitation),
      h(
        "a",
        { class: "src", href: fact.source.url, target: "_blank", rel },
        h("span", null, "Lire l'article", h("small", null, fact.source.name)),
        h("span", { "aria-hidden": "true" }, "↗"),
      ),
    ),
    previous,
    h(
      "p",
      { class: "srcline" },
      "Source : ",
      h("a", { href: fact.source.url, target: "_blank", rel }, fact.source.name),
    ),
  );

  root.replaceChildren(...header().filter(Boolean), main);
}

export function renderUnavailable(root) {
  root.replaceChildren(
    ...header().filter(Boolean),
    h("main", { class: "pad" }, h("p", { class: "empty" }, "Ce jour n'est pas encore disponible.")),
  );
}
