import { h } from "../dom.js";
import { header } from "./chrome.js";

/**
 * state : { standalone, status | null, enabledBefore, message? }
 * handlers : { onEnable(), onTest() }
 */
export function renderSetup(root, state, handlers) {
  const { standalone, status, enabledBefore, message } = state;
  const subscribed = !!(status && status.subscribed);
  const needsResubscribe = enabledBefore && status !== null && !status.subscribed;

  const install = !standalone
    ? h(
        "section",
        { class: "group" },
        h("h2", null, "Installer Kleio"),
        h(
          "ol",
          { class: "steps" },
          h("li", null, "Dans Safari, touche le bouton Partager."),
          h("li", null, "Choisis « Sur l'écran d'accueil »."),
          h("li", null, "Ouvre Kleio depuis son icône, puis reviens ici."),
        ),
      )
    : null;

  const actions = standalone
    ? h(
        "section",
        { class: "group" },
        h("h2", null, "Notifications"),
        h("p", null, "Une notification arrive chaque matin à 08:30. Aucun compte n'est nécessaire."),
        h("button", { type: "button", class: "btn primary", onclick: () => handlers.onEnable() }, "Activer les notifications"),
        subscribed
          ? h("button", { type: "button", class: "btn", onclick: () => handlers.onTest() }, "Envoyer une notification de test")
          : null,
      )
    : null;

  root.replaceChildren(
    ...header().filter(Boolean),
    h(
      "main",
      { class: "pad" },
      h("h1", { class: "large" }, "Réglages"),
      needsResubscribe
        ? h("div", { class: "alert", role: "alert" }, "Réactive les notifications : elles ne sont plus actives sur ce téléphone. Touche « Activer les notifications ».")
        : null,
      message ? h("p", { class: "msg", role: "status" }, message) : null,
      install,
      actions,
    ),
  );
}
