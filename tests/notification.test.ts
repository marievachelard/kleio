import { describe, expect, test } from "vitest";
import { buildNotification } from "../src/notification";
import { sendPush } from "../src/push";
import { generateVapidKeys } from "../src/vapidKeys";
import type { PinnedFact } from "../src/types";
import { makeEnv, makeSubscription } from "./helpers";

const fact: PinnedFact = {
  eventYear: 1945,
  title: "Création de l'UNESCO",
  short: "37 pays signent à Londres l'acte fondateur de l'UNESCO.",
  essential: "e",
  context: "c",
  didYouKnow: "d",
  invitation: "i",
  source: { name: "unesco.org", url: "https://www.unesco.org" },
  scope: "Monde",
  theme: "Institutions",
};

describe("buildNotification", () => {
  test("titre daté avec l'année de l'événement, corps court, lien vers le détail", () => {
    expect(buildNotification(fact, "2026-11-16")).toEqual({
      title: "16 novembre 1945",
      body: "37 pays signent à Londres l'acte fondateur de l'UNESCO.",
      url: "/#/day/2026-11-16",
    });
  });

  test("le premier du mois s'écrit 1er", () => {
    expect(buildNotification({ ...fact, eventYear: 1815 }, "2027-03-01").title).toBe("1er mars 1815");
  });
});

describe("generateVapidKeys", () => {
  test("produit des clés base64url de bonne longueur (65 et 32 octets)", async () => {
    const k = await generateVapidKeys();
    expect(Buffer.from(k.publicKey, "base64url")).toHaveLength(65);
    expect(Buffer.from(k.privateKey, "base64url")).toHaveLength(32);
  });
});

describe("sendPush", () => {
  const payload = { title: "16 novembre 1945", body: "Texte", url: "/#/day/2026-11-16" };

  test("201 du service push donne ok, avec une requête chiffrée et signée", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = async (url: string, init?: RequestInit) => {
      calls.push({ url, init: init! });
      return new Response(null, { status: 201 });
    };
    expect(await sendPush(sub, payload, env, fetchFn)).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(sub.endpoint);
    expect(String(calls[0].init.method).toUpperCase()).toBe("POST");
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get("content-encoding")).toBe("aes128gcm");
    expect(headers.get("authorization")).toMatch(/^vapid /);
  });

  test("410 signale un abonnement disparu", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    const result = await sendPush(sub, payload, env, async () => new Response(null, { status: 410 }));
    expect(result).toEqual({ ok: false, status: 410, gone: true });
  });

  test("404 aussi", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    const result = await sendPush(sub, payload, env, async () => new Response(null, { status: 404 }));
    expect(result).toEqual({ ok: false, status: 404, gone: true });
  });

  test("500 est un échec temporaire, pas un abonnement disparu", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    const result = await sendPush(sub, payload, env, async () => new Response(null, { status: 500 }));
    expect(result).toEqual({ ok: false, status: 500, gone: false });
  });

  test("une erreur réseau est un échec temporaire", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription();
    const result = await sendPush(sub, payload, env, async () => {
      throw new Error("réseau");
    });
    expect(result).toEqual({ ok: false, status: 0, gone: false });
  });
});
