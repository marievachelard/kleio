import { h } from "../dom.js";
import { formatDayTitle } from "../format.js";
import { header } from "./chrome.js";

/**
 * state : { standalone, status | null, hasKey, message? }
 * handlers : { onSaveKey(value), onEnable(), onTest() }
 */
export function renderSetup(root, state, handlers) {
  const { standalone, status, hasKey, message } = state;
  const needsResubscribe = status && status.subscribed && status.subscriptionValid === false;

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

  const keyField = h("input", { type: "password", id: "kleio-key", autocomplete: "off", "aria-label": "Clé d'accès", placeholder: hasKey ? "Clé enregistrée" : "Clé d'accès" });
  const keyBlock = h(
    "section",
    { class: "group" },
    h("h2", null, "Clé d'accès"),
    h("p", null, "Elle te protège : sans elle, personne d'autre ne peut s'inscrire aux notifications."),
    keyField,
    h("button", { type: "button", class: "btn", onclick: () => handlers.onSaveKey(keyField.value) }, "Enregistrer la clé"),
  );

  const actions =
    standalone && hasKey
      ? h(
          "section",
          { class: "group" },
          h("h2", null, "Notifications"),
          h("button", { type: "button", class: "btn primary", onclick: () => handlers.onEnable() }, "Activer les notifications"),
          h("button", { type: "button", class: "btn", onclick: () => handlers.onTest() }, "Envoyer une notification de test"),
        )
      : null;

  const statusBlock = status
    ? h(
        "section",
        { class: "group" },
        h("h2", null, "Statut"),
        h("p", null, status.subscribed ? (status.subscriptionValid ? "Inscription valide" : "Inscription à refaire") : "Pas encore inscrit"),
        h("p", null, status.lastSentDate ? `Dernier envoi : ${formatDayTitle(status.lastSentDate)}` : "Aucun envoi pour le moment"),
        h("p", null, status.todayReady ? "Fait du jour prêt" : "Aucun fait prêt pour aujourd'hui"),
      )
    : null;

  root.replaceChildren(
    ...header({ back: true }).filter(Boolean),
    h(
      "main",
      { class: "pad" },
      h("h1", { class: "large" }, "Réglages"),
      needsResubscribe
        ? h("div", { class: "alert", role: "alert" }, "Réinscris-toi : l'inscription aux notifications n'est plus valide. Touche « Activer les notifications ».")
        : null,
      message ? h("p", { class: "msg", role: "status" }, message) : null,
      install,
      keyBlock,
      actions,
      statusBlock,
    ),
  );
}
