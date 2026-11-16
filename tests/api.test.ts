import { describe, expect, test } from "vitest";
import { handleApi } from "../src/api";
import type { ContentData } from "../src/merge";
import type { Fact } from "../src/types";
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
const KEY = { "X-Kleio-Key": "cle-de-test" };

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

describe("inscription et statut", () => {
  test("subscribe sans clé renvoie 401", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    expect((await handleApi(post("/api/subscribe", sub), env, now, data)).status).toBe(401);
  });

  test("subscribe avec clé renvoie 204 et le statut indique l'inscription", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    expect((await handleApi(post("/api/subscribe", sub, KEY), env, now, data)).status).toBe(204);
    const status: any = await (await handleApi(get("/api/status", KEY), env, now, data)).json();
    expect(status).toEqual({
      subscribed: true,
      subscriptionValid: true,
      lastSentDate: null,
      lastSendOk: null,
      todayReady: true,
    });
  });

  test("subscribe refuse un corps invalide", async () => {
    const env = await makeEnv();
    const res = await handleApi(post("/api/subscribe", { endpoint: "http://x" }, KEY), env, now, data);
    expect(res.status).toBe(400);
  });

  test("status exige la clé", async () => {
    const env = await makeEnv();
    expect((await handleApi(get("/api/status"), env, now, data)).status).toBe(401);
  });
});

describe("POST /api/test", () => {
  test("sans inscription renvoie 409", async () => {
    const env = await makeEnv();
    const res = await handleApi(post("/api/test", {}, KEY), env, now, data);
    expect(res.status).toBe(409);
  });

  test("un 410 du service push invalide l'inscription", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    await handleApi(post("/api/subscribe", sub, KEY), env, now, data);
    const gone = async () => new Response(null, { status: 410 });
    const res = await handleApi(post("/api/test", {}, KEY), env, now, data, gone);
    expect(await res.json()).toEqual({ ok: false });
    const status: any = await (await handleApi(get("/api/status", KEY), env, now, data)).json();
    expect(status.subscriptionValid).toBe(false);
  });

  test("un envoi réussi renvoie ok", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    await handleApi(post("/api/subscribe", sub, KEY), env, now, data);
    const created = async () => new Response(null, { status: 201 });
    const res = await handleApi(post("/api/test", {}, KEY), env, now, data, created);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("routes inconnues", () => {
  test("renvoie 404", async () => {
    const env = await makeEnv();
    expect((await handleApi(get("/api/nimporte"), env, now, data)).status).toBe(404);
  });
});
