// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderSetup } from "../../public/app/views/setup.js";

const okStatus = { subscribed: true, lastSentDate: "2026-11-16", lastSendOk: true, todayReady: true };

function handlers() {
  return { onEnable: vi.fn(), onTest: vi.fn() };
}
const state = (over = {}) => ({ standalone: true, status: okStatus, enabledBefore: true, ...over });

let root;
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById("app");
});

const buttons = () => [...root.querySelectorAll("button")].map((b) => b.textContent);
const click = (label) => [...root.querySelectorAll("button")].find((b) => b.textContent === label).click();

describe("renderSetup", () => {
  test("hors de l'écran d'accueil : explique l'installation et masque l'activation", () => {
    renderSetup(root, state({ standalone: false, status: null, enabledBefore: false }), handlers());
    expect(root.textContent).toContain("Sur l'écran d'accueil");
    expect(buttons()).not.toContain("Activer les notifications");
  });

  test("n'affiche aucun champ de clé ni de mot de passe", () => {
    renderSetup(root, state(), handlers());
    expect(root.querySelector("input")).toBeNull();
    expect(root.textContent).not.toMatch(/clé d'accès/i);
  });

  test("installée : activation toujours proposée, test seulement si le téléphone est inscrit", () => {
    const h = handlers();
    renderSetup(root, state(), h);
    expect(buttons()).toContain("Activer les notifications");
    expect(buttons()).toContain("Envoyer une notification de test");
    click("Activer les notifications");
    click("Envoyer une notification de test");
    expect(h.onEnable).toHaveBeenCalledTimes(1);
    expect(h.onTest).toHaveBeenCalledTimes(1);

    renderSetup(root, state({ status: { ...okStatus, subscribed: false }, enabledBefore: false }), handlers());
    expect(buttons()).toContain("Activer les notifications");
    expect(buttons()).not.toContain("Envoyer une notification de test");
  });

  test("affiche le statut du téléphone : inscrit, dernier envoi, fait du jour prêt", () => {
    renderSetup(root, state(), handlers());
    const text = root.textContent;
    expect(text).toContain("Ce téléphone est inscrit");
    expect(text).toContain("Dernier envoi : 16 novembre");
    expect(text).toContain("Fait du jour prêt");
  });

  test("téléphone qui avait activé puis disparu du serveur : message « Réinscris-toi »", () => {
    renderSetup(root, state({ status: { ...okStatus, subscribed: false }, enabledBefore: true }), handlers());
    expect(root.querySelector(".alert").textContent).toContain("Réinscris-toi");
  });

  test("téléphone qui n'a jamais activé : pas d'alerte", () => {
    renderSetup(root, state({ status: { ...okStatus, subscribed: false }, enabledBefore: false }), handlers());
    expect(root.querySelector(".alert")).toBeNull();
  });

  test("aucun fait prêt pour aujourd'hui est signalé", () => {
    renderSetup(root, state({ status: { ...okStatus, todayReady: false } }), handlers());
    expect(root.textContent).toContain("Aucun fait prêt pour aujourd'hui");
  });

  test("sans statut (hors ligne), la page reste utilisable", () => {
    renderSetup(root, state({ status: null }), handlers());
    expect(buttons()).toContain("Activer les notifications");
  });

  test("le retour vers le calendrier est présent", () => {
    renderSetup(root, state(), handlers());
    expect(root.querySelector("a.back").getAttribute("href")).toBe("#/calendar");
  });

  test("affiche un message de résultat quand il est fourni", () => {
    renderSetup(root, state({ message: "Notifications activées." }), handlers());
    expect(root.querySelector(".msg").textContent).toBe("Notifications activées.");
  });
});
