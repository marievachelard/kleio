// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { currentEndpoint, enablePush, fetchStatus, isEnabledBefore, isStandalone, sendTest } from "../../public/app/push.js";

const PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const ENDPOINT = "https://web.push.apple.com/x";

function stubStandalone(value) {
  vi.stubGlobal("matchMedia", () => ({ matches: value }));
}

function stubBrowser({ permission = "granted", existing = null } = {}) {
  vi.stubGlobal("Notification", { requestPermission: async () => permission });
  const subscribe = vi.fn(async () => ({ endpoint: ENDPOINT, toJSON: () => ({ endpoint: ENDPOINT, keys: { auth: "a", p256dh: "p" } }) }));
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager: { subscribe, getSubscription: async () => existing } }) },
  });
  return subscribe;
}

beforeEach(() => {
  stubStandalone(false);
  localStorage.clear();
});
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
    expect(await enablePush()).toEqual({ ok: false, reason: "not-standalone" });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test("permission refusée renvoie denied", async () => {
    stubStandalone(true);
    stubBrowser({ permission: "denied" });
    expect(await enablePush()).toEqual({ ok: false, reason: "denied" });
  });

  test("inscrit le téléphone, sans clé d'accès, et s'en souvient", async () => {
    stubStandalone(true);
    const subscribe = stubBrowser();
    const calls = [];
    vi.stubGlobal("fetch", async (url, init) => {
      calls.push({ url, init });
      if (url === "/api/config") return new Response(JSON.stringify({ vapidPublicKey: PUBLIC_KEY }), { status: 200 });
      return new Response(null, { status: 204 });
    });
    expect(await enablePush()).toEqual({ ok: true });
    expect(subscribe.mock.calls[0][0].userVisibleOnly).toBe(true);
    expect(subscribe.mock.calls[0][0].applicationServerKey).toBeInstanceOf(Uint8Array);
    const post = calls.find((c) => c.url === "/api/subscribe");
    expect(post.init.method).toBe("POST");
    expect(JSON.stringify(post.init.headers)).not.toMatch(/key/i);
    expect(JSON.parse(post.init.body).endpoint).toBe(ENDPOINT);
    expect(isEnabledBefore()).toBe(true);
  });

  test("la limite de téléphones atteinte renvoie full", async () => {
    stubStandalone(true);
    stubBrowser();
    vi.stubGlobal("fetch", async (url) =>
      url === "/api/config"
        ? new Response(JSON.stringify({ vapidPublicKey: PUBLIC_KEY }), { status: 200 })
        : new Response(JSON.stringify({ error: "full" }), { status: 503 }),
    );
    expect(await enablePush()).toEqual({ ok: false, reason: "full" });
    expect(isEnabledBefore()).toBe(false);
  });

  test("tout autre refus du serveur renvoie error", async () => {
    stubStandalone(true);
    stubBrowser();
    vi.stubGlobal("fetch", async (url) =>
      url === "/api/config"
        ? new Response(JSON.stringify({ vapidPublicKey: PUBLIC_KEY }), { status: 200 })
        : new Response(null, { status: 400 }),
    );
    expect(await enablePush()).toEqual({ ok: false, reason: "error" });
  });
});

describe("currentEndpoint", () => {
  test("renvoie l'adresse de l'inscription du navigateur, ou null", async () => {
    stubBrowser({ existing: { endpoint: ENDPOINT } });
    expect(await currentEndpoint()).toBe(ENDPOINT);
    stubBrowser({ existing: null });
    expect(await currentEndpoint()).toBeNull();
  });
});

describe("sendTest et fetchStatus", () => {
  test("sendTest envoie l'adresse du téléphone et renvoie true sur ok", async () => {
    let body;
    vi.stubGlobal("fetch", async (url, init) => {
      body = JSON.parse(init.body);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    expect(await sendTest(ENDPOINT)).toBe(true);
    expect(body).toEqual({ endpoint: ENDPOINT });
  });

  test("sendTest renvoie false sur un échec ou un 404", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ ok: false }), { status: 200 }));
    expect(await sendTest(ENDPOINT)).toBe(false);
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }));
    expect(await sendTest(ENDPOINT)).toBe(false);
  });

  test("fetchStatus renvoie l'état, ou null hors ligne", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ subscribed: true }), { status: 200 }));
    expect(await fetchStatus(ENDPOINT)).toEqual({ subscribed: true });
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("hors ligne");
    });
    expect(await fetchStatus(ENDPOINT)).toBeNull();
  });
});
