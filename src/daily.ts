import { resolveDay } from "./content";
import { parisDate, shouldSendNow } from "./dates";
import type { ContentData } from "./merge";
import { buildNotification } from "./notification";
import { sendPush } from "./push";
import { deleteSubscription, listRecords, updateRecord } from "./store";
import type { Env } from "./types";

export type DailyOutcome = "skipped-time" | "skipped-no-fact" | "skipped-no-subscription" | "done";

export interface DailyReport {
  outcome: DailyOutcome;
  sent: number;
  failed: number;
  gone: number;
  alreadySent: number;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const EMPTY = { sent: 0, failed: 0, gone: 0, alreadySent: 0 };

/**
 * Envoi quotidien à tous les téléphones inscrits : une seule fois par téléphone et par jour de Paris,
 * seulement dans la fenêtre de 08:30, jamais sans fait prêt. Un téléphone en échec n'empêche pas les autres.
 */
export async function runDaily(
  env: Env,
  now: Date,
  data: ContentData,
  fetchFn: FetchLike = fetch,
): Promise<DailyReport> {
  if (!shouldSendNow(now)) return { outcome: "skipped-time", ...EMPTY };

  const today = parisDate(now);
  const view = resolveDay(today, today, data);
  if (!view) return { outcome: "skipped-no-fact", ...EMPTY };

  const records = await listRecords(env);
  if (records.length === 0) return { outcome: "skipped-no-subscription", ...EMPTY };

  const payload = buildNotification(view.fact, today);
  const report: DailyReport = { outcome: "done", ...EMPTY };

  for (const { id, record } of records) {
    if (record.lastSentDate === today) {
      report.alreadySent++;
      continue;
    }
    const result = await sendPush(record.subscription, payload, env, fetchFn);
    if (result.ok) {
      await updateRecord(env, id, { lastSentDate: today, lastSendOk: true });
      report.sent++;
    } else if (result.gone) {
      await deleteSubscription(env, record.subscription.endpoint!);
      report.gone++;
    } else {
      await updateRecord(env, id, { lastSendOk: false });
      report.failed++;
    }
  }
  return report;
}
