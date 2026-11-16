import type { Env, PushSubscriptionJSON } from "./types";

/** Limite prudente pour l'offre gratuite de Cloudflare (temps de calcul d'un envoi planifié). */
export const MAX_SUBSCRIPTIONS = 25;

const PREFIX = "sub:";

export interface SubscriptionRecord {
  subscription: PushSubscriptionJSON;
  lastSentDate: string | null;
  lastSendOk: boolean | null;
}

/** Identifiant de stockage : un hachage de l'adresse, pour ne pas la lire en clair dans les clés. */
export async function subscriptionId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return PREFIX + hex.slice(0, 32);
}

async function readRecord(env: Env, id: string): Promise<SubscriptionRecord | null> {
  const raw = await env.KLEIO_KV.get(id);
  return raw ? (JSON.parse(raw) as SubscriptionRecord) : null;
}

export async function getRecord(env: Env, endpoint: string): Promise<SubscriptionRecord | null> {
  return readRecord(env, await subscriptionId(endpoint));
}

export async function listRecords(env: Env): Promise<{ id: string; record: SubscriptionRecord }[]> {
  const out: { id: string; record: SubscriptionRecord }[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.KLEIO_KV.list({ prefix: PREFIX, cursor });
    for (const { name } of page.keys) {
      const record = await readRecord(env, name);
      if (record) out.push({ id: name, record });
    }
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
  } while (cursor);
  return out;
}

/** Enregistre ou met à jour un téléphone. Refuse un nouveau téléphone quand la limite est atteinte. */
export async function saveSubscription(env: Env, sub: PushSubscriptionJSON): Promise<"saved" | "full"> {
  const id = await subscriptionId(sub.endpoint!);
  const existing = await readRecord(env, id);
  if (!existing && (await listRecords(env)).length >= MAX_SUBSCRIPTIONS) return "full";
  const record: SubscriptionRecord = {
    subscription: sub,
    lastSentDate: existing?.lastSentDate ?? null,
    lastSendOk: existing?.lastSendOk ?? null,
  };
  await env.KLEIO_KV.put(id, JSON.stringify(record));
  return "saved";
}

export async function updateRecord(
  env: Env,
  id: string,
  patch: Partial<Pick<SubscriptionRecord, "lastSentDate" | "lastSendOk">>,
): Promise<void> {
  const existing = await readRecord(env, id);
  if (!existing) return;
  await env.KLEIO_KV.put(id, JSON.stringify({ ...existing, ...patch }));
}

export async function deleteSubscription(env: Env, endpoint: string): Promise<void> {
  await env.KLEIO_KV.delete(await subscriptionId(endpoint));
}
