import { resolveDay } from "./content";
import { parisDate, shouldSendNow } from "./dates";
import type { ContentData } from "./merge";
import { buildNotification } from "./notification";
import { sendPush } from "./push";
import { getSendState, getSubscription, recordSend, setSubscriptionValid } from "./store";
import type { Env } from "./types";

export type DailyOutcome =
  | "sent"
  | "skipped-time"
  | "skipped-already-sent"
  | "skipped-no-fact"
  | "skipped-no-subscription"
  | "failed"
  | "subscription-gone";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Envoi quotidien : une seule fois par jour de Paris, seulement dans la fenêtre de 08:30, jamais sans fait. */
export async function runDaily(
  env: Env,
  now: Date,
  data: ContentData,
  fetchFn: FetchLike = fetch,
): Promise<DailyOutcome> {
  if (!shouldSendNow(now)) return "skipped-time";

  const today = parisDate(now);
  const state = await getSendState(env);
  if (state.lastSentDate === today) return "skipped-already-sent";

  const view = resolveDay(today, today, data);
  if (!view) return "skipped-no-fact";

  const sub = await getSubscription(env);
  if (!sub || !state.subscriptionValid) return "skipped-no-subscription";

  const result = await sendPush(sub, buildNotification(view.fact, today), env, fetchFn);
  if (result.ok) {
    await recordSend(env, today, true);
    return "sent";
  }
  await recordSend(env, today, false);
  if (result.gone) {
    await setSubscriptionValid(env, false);
    return "subscription-gone";
  }
  return "failed";
}
