import { describe, expect, test } from "vitest";
import {
  MAX_SUBSCRIPTIONS,
  deleteSubscription,
  getRecord,
  listRecords,
  saveSubscription,
  subscriptionId,
  updateRecord,
} from "../src/store";
import { makeEnv, makeSubscription } from "./helpers";

const endpoint = (i: number) => `https://web.push.apple.com/appareil-${i}`;

describe("store", () => {
  test("enregistre une inscription avec un état d'envoi vide", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription(endpoint(1));
    expect(await saveSubscription(env, sub)).toBe("saved");
    const record = await getRecord(env, endpoint(1));
    expect(record).toEqual({ subscription: sub, lastSentDate: null, lastSendOk: null });
  });

  test("la clé de stockage ne contient pas l'adresse en clair", async () => {
    const id = await subscriptionId(endpoint(1));
    expect(id.startsWith("sub:")).toBe(true);
    expect(id).not.toContain("apple");
    expect(await subscriptionId(endpoint(1))).toBe(id);
    expect(await subscriptionId(endpoint(2))).not.toBe(id);
  });

  test("se réinscrire avec la même adresse garde le dernier envoi", async () => {
    const env = await makeEnv();
    const sub = await makeSubscription(endpoint(1));
    await saveSubscription(env, sub);
    await updateRecord(env, await subscriptionId(endpoint(1)), { lastSentDate: "2026-11-17", lastSendOk: true });
    await saveSubscription(env, sub);
    expect((await getRecord(env, endpoint(1)))?.lastSentDate).toBe("2026-11-17");
  });

  test(`refuse la ${MAX_SUBSCRIPTIONS + 1}e inscription mais accepte une réinscription existante`, async () => {
    const env = await makeEnv();
    for (let i = 0; i < MAX_SUBSCRIPTIONS; i++) {
      expect(await saveSubscription(env, await makeSubscription(endpoint(i)))).toBe("saved");
    }
    expect(await saveSubscription(env, await makeSubscription(endpoint(999)))).toBe("full");
    expect(await saveSubscription(env, await makeSubscription(endpoint(0)))).toBe("saved");
    expect(await listRecords(env)).toHaveLength(MAX_SUBSCRIPTIONS);
  });

  test("supprime une inscription", async () => {
    const env = await makeEnv();
    await saveSubscription(env, await makeSubscription(endpoint(1)));
    await deleteSubscription(env, endpoint(1));
    expect(await getRecord(env, endpoint(1))).toBeNull();
  });

  test("liste toutes les inscriptions avec leur identifiant", async () => {
    const env = await makeEnv();
    await saveSubscription(env, await makeSubscription(endpoint(1)));
    await saveSubscription(env, await makeSubscription(endpoint(2)));
    const all = await listRecords(env);
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.id).sort()).toEqual([await subscriptionId(endpoint(1)), await subscriptionId(endpoint(2))].sort());
  });
});
