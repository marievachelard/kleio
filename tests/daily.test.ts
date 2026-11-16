import { describe, expect, test } from "vitest";
import { runDaily } from "../src/daily";
import type { ContentData } from "../src/merge";
import { getSendState, saveSubscription, setSubscriptionValid } from "../src/store";
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

function recorder(status = 201) {
  const calls: string[] = [];
  const fetchFn = async (url: string) => {
    calls.push(url);
    return new Response(null, { status });
  };
  return { calls, fetchFn };
}

async function setup() {
  const env = await makeEnv();
  await saveSubscription(env, await makeSubscription());
  return env;
}

describe("runDaily", () => {
  test("hors de la fenêtre de 08:30 heure de Paris, ne fait rien", async () => {
    const env = await setup();
    const { calls, fetchFn } = recorder();
    expect(await runDaily(env, new Date("2026-11-17T06:30:00Z"), data, fetchFn)).toBe("skipped-time");
    expect(calls).toHaveLength(0);
  });

  test("à 08:30 avec un fait prêt, envoie et mémorise le jour", async () => {
    const env = await setup();
    const { calls, fetchFn } = recorder();
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, fetchFn)).toBe("sent");
    expect(calls).toHaveLength(1);
    expect(await getSendState(env)).toMatchObject({ lastSentDate: "2026-11-17", lastSendOk: true });
  });

  test("un second déclenchement le même jour n'envoie rien", async () => {
    const env = await setup();
    const { calls, fetchFn } = recorder();
    await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, fetchFn);
    expect(await runDaily(env, new Date("2026-11-17T07:35:00Z"), data, fetchFn)).toBe("skipped-already-sent");
    expect(calls).toHaveLength(1);
  });

  test("sans fait prêt, n'envoie aucune notification", async () => {
    const env = await setup();
    const { calls, fetchFn } = recorder();
    const empty: ContentData = { ...data, days: {} };
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), empty, fetchFn)).toBe("skipped-no-fact");
    expect(calls).toHaveLength(0);
  });

  test("sans inscription, n'envoie rien", async () => {
    const env = await makeEnv();
    const { calls, fetchFn } = recorder();
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, fetchFn)).toBe("skipped-no-subscription");
    expect(calls).toHaveLength(0);
  });

  test("une inscription déjà marquée invalide n'est pas utilisée", async () => {
    const env = await setup();
    await setSubscriptionValid(env, false);
    const { calls, fetchFn } = recorder();
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, fetchFn)).toBe("skipped-no-subscription");
    expect(calls).toHaveLength(0);
  });

  test("un 410 marque l'inscription invalide", async () => {
    const env = await setup();
    const { fetchFn } = recorder(410);
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, fetchFn)).toBe("subscription-gone");
    expect(await getSendState(env)).toMatchObject({ subscriptionValid: false, lastSendOk: false, lastSentDate: null });
  });

  test("un 500 est un échec qui laisse le jour rejouable", async () => {
    const env = await setup();
    const failing = recorder(500);
    expect(await runDaily(env, new Date("2026-11-17T07:30:00Z"), data, failing.fetchFn)).toBe("failed");
    expect((await getSendState(env)).lastSentDate).toBeNull();
    const ok = recorder(201);
    expect(await runDaily(env, new Date("2026-11-17T07:35:00Z"), data, ok.fetchFn)).toBe("sent");
  });
});
