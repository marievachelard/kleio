import type { Env, PushSubscriptionJSON } from "./types";

export interface SendState {
  lastSentDate: string | null;
  lastSendOk: boolean | null;
  subscriptionValid: boolean;
}

export async function getSubscription(env: Env): Promise<PushSubscriptionJSON | null> {
  const raw = await env.KLEIO_KV.get("subscription");
  return raw ? (JSON.parse(raw) as PushSubscriptionJSON) : null;
}

/** Remplace l'unique inscription et la déclare valide. */
export async function saveSubscription(env: Env, sub: PushSubscriptionJSON): Promise<void> {
  await env.KLEIO_KV.put("subscription", JSON.stringify(sub));
  await env.KLEIO_KV.put("subscriptionValid", "true");
}

export async function setSubscriptionValid(env: Env, valid: boolean): Promise<void> {
  await env.KLEIO_KV.put("subscriptionValid", valid ? "true" : "false");
}

export async function getSendState(env: Env): Promise<SendState> {
  const [lastSentDate, lastSendOk, valid] = await Promise.all([
    env.KLEIO_KV.get("lastSentDate"),
    env.KLEIO_KV.get("lastSendOk"),
    env.KLEIO_KV.get("subscriptionValid"),
  ]);
  return {
    lastSentDate,
    lastSendOk: lastSendOk === null ? null : lastSendOk === "true",
    subscriptionValid: valid !== "false",
  };
}

/** `lastSentDate` n'avance qu'après un envoi réussi : un échec laisse le jour rejouable. */
export async function recordSend(env: Env, date: string, ok: boolean): Promise<void> {
  await env.KLEIO_KV.put("lastSendOk", ok ? "true" : "false");
  if (ok) await env.KLEIO_KV.put("lastSentDate", date);
}
