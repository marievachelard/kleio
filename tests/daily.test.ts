import { describe, expect, test } from "vitest";
import { runDaily } from "../src/daily";
import type { ContentData } from "../src/merge";
import { getRecord, listRecords, saveSubscription } from "../src/store";
import type { Fact } from "../src/types";
import { makeEnv, makeSubscription } from "./helpers";

const fact = (date: string): Fact => ({
  date,
  eventYear: 1945,
  title: "Création de l'UNESCO",
  short: "37 pays signent à Londres l'acte fondateur.",
  essential: "e",
  context: "c",
  didYouKnow: "d",
  invitation: "i",
  source: { name: "unesco.org", url: "https://www.unesco.org" },
  scope: "Monde",
  theme: "Institutions",
});

const data: ContentData = {
  launchDate: "2026-11-17",
  pinned: {},
  days: { "2026-11-17": fact("2026-11-17") },
};

const WINTER_0830 = new Date("2026-11-17T07:30:00Z");
const ep = (i: number) => `https://web.push.apple.com/tel-${i}`;

/** Simule le service push : `statuses` associe une adresse à un statut (201 par défaut). */
function pushService(statuses: Record<string, number> = {}) {
  const calls: string[] = [];
  const fetchFn = async (url: string) => {
    calls.push(url);
    return new Response(null, { status: statuses[url] ?? 201 });
  };
  return { calls, fetchFn };
}

async function withPhones(n: number) {
  const env = await makeEnv();
  for (let i = 1; i <= n; i++) await saveSubscription(env, await makeSubscription(ep(i)));
  return env;
}

describe("runDaily", () => {
  test("hors de la fenêtre de 08:30 heure de Paris, ne fait rien", async () => {
    const env = await withPhones(1);
    const { calls, fetchFn } = pushService();
    const report = await runDaily(env, new Date("2026-11-17T06:30:00Z"), data, fetchFn);
    expect(report.outcome).toBe("skipped-time");
    expect(calls).toHaveLength(0);
  });

  test("à 08:30 avec un fait prêt, envoie à tous les téléphones", async () => {
    const env = await withPhones(3);
    const { calls, fetchFn } = pushService();
    const report = await runDaily(env, WINTER_0830, data, fetchFn);
    expect(report).toEqual({ outcome: "done", sent: 3, failed: 0, gone: 0, alreadySent: 0 });
    expect(calls.sort()).toEqual([ep(1), ep(2), ep(3)]);
    expect((await getRecord(env, ep(1)))?.lastSentDate).toBe("2026-11-17");
  });

  test("un second déclenchement le même jour n'envoie plus rien", async () => {
    const env = await withPhones(2);
    const { calls, fetchFn } = pushService();
    await runDaily(env, WINTER_0830, data, fetchFn);
    const second = await runDaily(env, new Date("2026-11-17T07:35:00Z"), data, fetchFn);
    expect(second).toEqual({ outcome: "done", sent: 0, failed: 0, gone: 0, alreadySent: 2 });
    expect(calls).toHaveLength(2);
  });

  test("sans fait prêt, n'envoie aucune notification", async () => {
    const env = await withPhones(2);
    const { calls, fetchFn } = pushService();
    const report = await runDaily(env, WINTER_0830, { ...data, days: {} }, fetchFn);
    expect(report.outcome).toBe("skipped-no-fact");
    expect(calls).toHaveLength(0);
  });

  test("sans aucun téléphone inscrit, n'envoie rien", async () => {
    const env = await makeEnv();
    const { calls, fetchFn } = pushService();
    const report = await runDaily(env, WINTER_0830, data, fetchFn);
    expect(report.outcome).toBe("skipped-no-subscription");
    expect(calls).toHaveLength(0);
  });

  test("un téléphone disparu (410) est supprimé sans empêcher les autres", async () => {
    const env = await withPhones(3);
    const { fetchFn } = pushService({ [ep(2)]: 410 });
    const report = await runDaily(env, WINTER_0830, data, fetchFn);
    expect(report).toEqual({ outcome: "done", sent: 2, failed: 0, gone: 1, alreadySent: 0 });
    expect(await getRecord(env, ep(2))).toBeNull();
    expect(await listRecords(env)).toHaveLength(2);
  });

  test("un échec temporaire (500) laisse ce téléphone rejouable sans doubler les autres", async () => {
    const env = await withPhones(2);
    const first = pushService({ [ep(1)]: 500 });
    const report = await runDaily(env, WINTER_0830, data, first.fetchFn);
    expect(report).toEqual({ outcome: "done", sent: 1, failed: 1, gone: 0, alreadySent: 0 });
    expect((await getRecord(env, ep(1)))?.lastSendOk).toBe(false);
    expect((await getRecord(env, ep(1)))?.lastSentDate).toBeNull();

    const retry = pushService();
    const second = await runDaily(env, new Date("2026-11-17T07:35:00Z"), data, retry.fetchFn);
    expect(second).toEqual({ outcome: "done", sent: 1, failed: 0, gone: 0, alreadySent: 1 });
    expect(retry.calls).toEqual([ep(1)]);
  });

  test("une erreur réseau sur un téléphone n'arrête pas les autres", async () => {
    const env = await withPhones(2);
    const calls: string[] = [];
    const fetchFn = async (url: string) => {
      calls.push(url);
      if (url === ep(1)) throw new Error("réseau");
      return new Response(null, { status: 201 });
    };
    const report = await runDaily(env, WINTER_0830, data, fetchFn);
    expect(report.sent).toBe(1);
    expect(report.failed).toBe(1);
  });
});
