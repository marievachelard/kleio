import { describe, expect, test } from "vitest";
import { handleApi } from "../src/api";
import type { ContentData } from "../src/merge";
import type { Fact } from "../src/types";
import { MAX_SUBSCRIPTIONS } from "../src/store";
import { makeEnv, makeSubscription } from "./helpers";

function fact(date: string, title: string): Fact {
  return {
    date,
    eventYear: 1945,
    title,
    short: `${title} court`,
    essential: `${title} essentiel`,
    context: `${title} contexte`,
    didYouKnow: `${title} anecdote`,
    invitation: "Invitation.",
    source: { name: "exemple.org", url: "https://exemple.org/a" },
    scope: "Monde",
    theme: "Institutions",
  };
}

const data: ContentData = {
  launchDate: "2026-11-17",
  pinned: {},
  days: {
    "2026-11-17": fact("2026-11-17", "Jour un"),
    "2026-11-18": fact("2026-11-18", "SECRET futur"),
  },
};
const now = new Date("2026-11-17T10:00:00Z");

const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://kleio.test${path}`, { headers });
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://kleio.test${path}`, { method: "POST", body: JSON.stringify(body), headers });

describe("GET /api/day/:date", () => {
  test("un jour futur renvoie 404 sans aucun texte du fait", async () => {
    const env = await makeEnv();
    const res = await handleApi(get("/api/day/2026-11-18"), env, now, data);
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).not.toContain("SECRET");
    expect(JSON.parse(text)).toEqual({ error: "not-found" });
  });

  test("une date impossible renvoie 404", async () => {
    const env = await makeEnv();
    expect((await handleApi(get("/api/day/2026-02-30"), env, now, data)).status).toBe(404);
  });

  test("le jour d'aujourd'hui renvoie le détail, sans cache", async () => {
    const env = await makeEnv();
    const res = await handleApi(get("/api/day/2026-11-17"), env, now, data);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const view: any = await res.json();
    expect(view.fact.title).toBe("Jour un");
    expect(view.previous).toEqual([]);
  });
});

describe("GET /api/days", () => {
  test("ne liste que les jours déjà passés", async () => {
    const env = await makeEnv();
    const res = await handleApi(get("/api/days"), env, now, data);
    const body: any = await res.json();
    expect(body.today).toBe("2026-11-17");
    expect(body.launchDate).toBe("2026-11-17");
    expect(body.days).toEqual([{ date: "2026-11-17", title: "Jour un", pinned: false, eventYear: 1945, short: "Jour un court" }]);
    expect(JSON.stringify(body)).not.toContain("SECRET");
  });
});

describe("POST /api/subscribe", () => {
  test("accepte une inscription sans aucune clé", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    expect((await handleApi(post("/api/subscribe", sub), env, now, data)).status).toBe(204);
    const status: any = await (await handleApi(post("/api/status", { endpoint: sub.endpoint }), env, now, data)).json();
    expect(status.subscribed).toBe(true);
  });

  test("refuse un corps invalide", async () => {
    const env = await makeEnv();
    const res = await handleApi(post("/api/subscribe", { endpoint: "http://x" }), env, now, data);
    expect(res.status).toBe(400);
  });

  test("refuse une adresse qui n'est pas celle d'un service de notification", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription("https://exemple.org/push");
    const res = await handleApi(post("/api/subscribe", sub), env, now, data);
    expect(res.status).toBe(400);
  });

  test("refuse proprement quand la limite de téléphones est atteinte", async () => {
    const env = await makeEnv();
    for (let i = 0; i < MAX_SUBSCRIPTIONS; i++) {
      const sub = await makeSubscription(`https://web.push.apple.com/t-${i}`);
      expect((await handleApi(post("/api/subscribe", sub), env, now, data)).status).toBe(204);
    }
    const extra = await makeSubscription("https://web.push.apple.com/un-de-trop");
    const res = await handleApi(post("/api/subscribe", extra), env, now, data);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "full" });
  });
});

describe("POST /api/status", () => {
  test("décrit l'inscription du téléphone qui demande", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    await handleApi(post("/api/subscribe", sub), env, now, data);
    const res = await handleApi(post("/api/status", { endpoint: sub.endpoint }), env, now, data);
    expect(await res.json()).toEqual({ subscribed: true, lastSentDate: null, lastSendOk: null, todayReady: true });
  });

  test("un téléphone inconnu n'est pas inscrit", async () => {
    const env = await makeEnv();
    const res = await handleApi(post("/api/status", { endpoint: "https://web.push.apple.com/inconnu" }), env, now, data);
    expect(await res.json()).toEqual({ subscribed: false, lastSentDate: null, lastSendOk: null, todayReady: true });
  });

  test("sans adresse, répond comme un téléphone non inscrit", async () => {
    const env = await makeEnv();
    const res = await handleApi(post("/api/status", {}), env, now, data);
    expect((await res.json() as any).subscribed).toBe(false);
  });
});

describe("POST /api/test", () => {
  test("pour un téléphone non inscrit renvoie 404 sans rien envoyer", async () => {
    const env = await makeEnv();
    const calls: string[] = [];
    const fetchFn = async (u: string) => {
      calls.push(u);
      return new Response(null, { status: 201 });
    };
    const res = await handleApi(post("/api/test", { endpoint: "https://web.push.apple.com/inconnu" }), env, now, data, fetchFn);
    expect(res.status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  test("un 410 du service push supprime l'inscription", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    await handleApi(post("/api/subscribe", sub), env, now, data);
    const gone = async () => new Response(null, { status: 410 });
    const res = await handleApi(post("/api/test", { endpoint: sub.endpoint }), env, now, data, gone);
    expect(await res.json()).toEqual({ ok: false });
    const status: any = await (await handleApi(post("/api/status", { endpoint: sub.endpoint }), env, now, data)).json();
    expect(status.subscribed).toBe(false);
  });

  test("un envoi réussi renvoie ok et n'écrit qu'à ce téléphone", async () => {
    const env = await makeEnv();
    const mine = await makeSubscription("https://web.push.apple.com/moi");
    const other = await makeSubscription("https://web.push.apple.com/autre");
    await handleApi(post("/api/subscribe", mine), env, now, data);
    await handleApi(post("/api/subscribe", other), env, now, data);
    const urls: string[] = [];
    const created = async (u: string) => {
      urls.push(u);
      return new Response(null, { status: 201 });
    };
    const res = await handleApi(post("/api/test", { endpoint: mine.endpoint }), env, now, data, created);
    expect(await res.json()).toEqual({ ok: true });
    expect(urls).toEqual([mine.endpoint]);
  });
});

describe("GET /api/config", () => {
  test("expose la clé publique VAPID sans authentification, jamais la clé privée", async () => {
    const env = await makeEnv();
    const res = await handleApi(get("/api/config"), env, now, data);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ vapidPublicKey: env.VAPID_PUBLIC_KEY });
    expect(text).not.toContain(env.VAPID_PRIVATE_KEY);
  });
});
