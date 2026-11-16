// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderSetup } from "../../public/app/views/setup.js";

const okStatus = { subscribed: true, subscriptionValid: true, lastSentDate: "2026-11-16", lastSendOk: true, todayReady: true };

function handlers() {
  return { onSaveKey: vi.fn(), onEnable: vi.fn(), onTest: vi.fn() };
}

let root;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById("app");
});

const buttons = () => [...root.querySelectorAll("button")].map((b) => b.textContent);

describe("renderSetup", () => {
  test("hors de l'écran d'accueil : explique l'installation et masque l'activation", () => {
    renderSetup(root, { standalone: false, status: null, hasKey: false }, handlers());
    expect(root.textContent).toContain("Sur l'écran d'accueil");
    expect(buttons()).not.toContain("Activer les notifications");
  });

  test("sans clé enregistrée : propose de la saisir, pas d'activation", () => {
    renderSetup(root, { standalone: true, status: null, hasKey: false }, handlers());
    expect(root.querySelector("input[type=password]")).not.toBeNull();
    expect(buttons()).toContain("Enregistrer la clé");
    expect(buttons()).not.toContain("Activer les notifications");
  });

  test("enregistrer la clé transmet la valeur saisie", () => {
    const h = handlers();
    renderSetup(root, { standalone: true, status: null, hasKey: false }, h);
    root.querySelector("input[type=password]").value = "ma-cle";
    [...root.querySelectorAll("button")].find((b) => b.textContent === "Enregistrer la clé").click();
    expect(h.onSaveKey).toHaveBeenCalledWith("ma-cle");
  });

  test("installée avec une clé : activation et test disponibles", () => {
    const h = handlers();
    renderSetup(root, { standalone: true, status: okStatus, hasKey: true }, h);
    expect(buttons()).toContain("Activer les notifications");
    expect(buttons()).toContain("Envoyer une notification de test");
    [...root.querySelectorAll("button")].find((b) => b.textContent === "Activer les notifications").click();
    [...root.querySelectorAll("button")].find((b) => b.textContent === "Envoyer une notification de test").click();
    expect(h.onEnable).toHaveBeenCalledTimes(1);
    expect(h.onTest).toHaveBeenCalledTimes(1);
  });

  test("affiche le statut : inscription valide, dernier envoi, fait du jour prêt", () => {
    renderSetup(root, { standalone: true, status: okStatus, hasKey: true }, handlers());
    const text = root.textContent;
    expect(text).toContain("Inscription valide");
    expect(text).toContain("16 novembre");
    expect(text).toContain("Fait du jour prêt");
  });

  test("inscription invalide : message « Réinscris-toi » bien visible", () => {
    renderSetup(root, { standalone: true, status: { ...okStatus, subscriptionValid: false }, hasKey: true }, handlers());
    expect(root.querySelector(".alert").textContent).toContain("Réinscris-toi");
  });

  test("aucun fait prêt pour aujourd'hui est signalé", () => {
    renderSetup(root, { standalone: true, status: { ...okStatus, todayReady: false }, hasKey: true }, handlers());
    expect(root.textContent).toContain("Aucun fait prêt pour aujourd'hui");
  });

  test("le retour vers le calendrier est présent", () => {
    renderSetup(root, { standalone: true, status: null, hasKey: false }, handlers());
    expect(root.querySelector("a.back").getAttribute("href")).toBe("#/calendar");
  });

  test("affiche un message de résultat quand il est fourni", () => {
    renderSetup(root, { standalone: true, status: null, hasKey: true, message: "Notifications activées." }, handlers());
    expect(root.querySelector(".msg").textContent).toBe("Notifications activées.");
  });
});
