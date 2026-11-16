import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";
import type { NotificationPayload } from "./notification";
import type { Env, PushSubscriptionJSON } from "./types";

export type PushResult = { ok: true } | { ok: false; status: number; gone: boolean };

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Envoie la notification chiffrée au service push de l'abonnement. 404 et 410 signalent un abonnement disparu. */
export async function sendPush(
  sub: PushSubscriptionJSON,
  payload: NotificationPayload,
  env: Env,
  fetchFn: FetchLike = fetch,
): Promise<PushResult> {
  const subscription: PushSubscription = {
    endpoint: sub.endpoint!,
    expirationTime: sub.expirationTime ?? null,
    keys: { auth: sub.keys!.auth, p256dh: sub.keys!.p256dh },
  };
  const request = await buildPushPayload(
    { data: payload, options: { ttl: 6 * 60 * 60, urgency: "normal" } },
    subscription,
    { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY },
  );
  try {
    const res = await fetchFn(subscription.endpoint, request);
    if (res.status >= 200 && res.status < 300) return { ok: true };
    return { ok: false, status: res.status, gone: res.status === 404 || res.status === 410 };
  } catch {
    return { ok: false, status: 0, gone: false };
  }
}
