// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { enablePush, isStandalone, sendTest } from "../../public/app/push.js";

const PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function stubStandalone(value) {
  vi.stubGlobal("matchMedia", () => ({ matches: value }));
}

function stubBrowser({ permission = "granted", subscription } = {}) {
  vi.stubGlobal("Notification", { requestPermission: async () => permission });
  const subscribe = vi.fn(async () => subscription ?? { toJSON: () => ({ endpoint: "https://web.push.apple.com/x", keys: { auth: "a", p256dh: "p" } }) });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager: { subscribe } }) },
  });
  return subscribe;
}

beforeEach(() => stubStandalone(false));
afterEach(() => vi.unstubAllGlobals());

describe("isStandalone", () => {
  test("faux dans un onglet Safari, vrai depuis l'écran d'accueil", () => {
    stubStandalone(false);
    expect(isStandalone()).toBe(false);
    stubStandalone(true);
    expect(isStandalone()).toBe(true);
  });
});

describe("enablePush", () => {
  test("hors de l'écran d'accueil renvoie not-standalone sans rien demander", async () => {
    const requestPermission = vi.fn();
    vi.stubGlobal("Notification", { requestPermission });
    expect(await enablePush("cle")).toEqual({ ok: false, reason: "not-standalone" });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test("permission refusée renvoie denied", async () => {
    stubStandalone(true);
    stubBrowser({ permission: "denied" });
    expect(await enablePush("cle")).toEqual({ ok: false, reason: "denied" });
  });

  test("inscrit l'appareil et envoie l'abonnement avec la clé d'accès", async () => {
    stubStandalone(true);
    const subscribe = stubBrowser();
    const calls = [];
    vi.stubGlobal("fetch", async (url, init) => {
      calls.push({ url, init });
      if (url === "/api/config") return new Response(JSON.stringify({ vapidPublicKey: PUBLIC_KEY }), { status: 200 });
      return new Response(null, { status: 204 });
    });
    expect(await enablePush("ma-cle")).toEqual({ ok: true });
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe.mock.calls[0][0].userVisibleOnly).toBe(true);
    expect(subscribe.mock.calls[0][0].applicationServerKey).toBeInstanceOf(Uint8Array);
    const post = calls.find((c) => c.url === "/api/subscribe");
    expect(post.init.method).toBe("POST");
    expect(post.init.headers["X-Kleio-Key"]).toBe("ma-cle");
    expect(JSON.parse(post.init.body).endpoint).toBe("https://web.push.apple.com/x");
  });

  test("un refus du serveur (clé fausse) renvoie error", async () => {
    stubStandalone(true);
    stubBrowser();
    vi.stubGlobal("fetch", async (url) =>
      url === "/api/config"
        ? new Response(JSON.stringify({ vapidPublicKey: PUBLIC_KEY }), { status: 200 })
        : new Response(null, { status: 401 }),
    );
    expect(await enablePush("mauvaise")).toEqual({ ok: false, reason: "error" });
  });
});

describe("sendTest", () => {
  test("renvoie true quand le serveur confirme l'envoi", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    expect(await sendTest("cle")).toBe(true);
  });
  test("renvoie false sur un échec", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ ok: false }), { status: 200 }));
    expect(await sendTest("cle")).toBe(false);
    vi.stubGlobal("fetch", async () => new Response(null, { status: 401 }));
    expect(await sendTest("cle")).toBe(false);
  });
});
