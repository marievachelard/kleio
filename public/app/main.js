import { fetchDay, fetchDays } from "./api.js";
import { h } from "./dom.js";
import { parseRoute } from "./router.js";
import { addMonth } from "./format.js";
import { renderCalendar } from "./views/calendar.js";
import { header, mountHeader } from "./views/chrome.js";
import { renderDetail, renderUnavailable } from "./views/detail.js";
import { currentEndpoint, enablePush, fetchStatus, isEnabledBefore, isStandalone, sendTest } from "./push.js";
import { renderSetup } from "./views/setup.js";

const root = document.getElementById("app");
// L'en-tête (nom, plume, réglages) est créé une seule fois : il ne se reconstruit jamais quand on change d'écran.
const pageHeader = mountHeader(document.getElementById("app-header"));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

let calendar = null; // { today, launchDate, days, monthIso, selected }

function lastDayOfMonth(days, monthIso) {
  const inMonth = days.filter((d) => d.date.startsWith(monthIso));
  return inMonth.length > 0 ? inMonth[inMonth.length - 1].date : null;
}

function renderOffline() {
  root.replaceChildren(
    ...header({ back: true }).filter(Boolean),
    h("main", { class: "pad" }, h("p", { class: "empty" }, "Pas de connexion pour le moment. Réessaie dans un instant.")),
  );
}

function drawCalendar() {
  renderCalendar(root, calendar, {
    onSelect(date) {
      calendar.selected = date;
      drawCalendar();
    },
    onOpen(date) {
      location.hash = `#/day/${date}`;
    },
    onMonth(delta) {
      calendar.monthIso = addMonth(calendar.monthIso, delta);
      calendar.selected = lastDayOfMonth(calendar.days, calendar.monthIso);
      drawCalendar();
    },
  });
}

async function showCalendar() {
  const { today, launchDate, days } = await fetchDays();
  const monthIso = calendar && calendar.today === today ? calendar.monthIso : today.slice(0, 7);
  const selected = days.some((d) => d.date === today) ? today : lastDayOfMonth(days, monthIso);
  calendar = { today, launchDate, days, monthIso, selected };
  drawCalendar();
}

async function showDay(date) {
  const view = await fetchDay(date);
  if (view) renderDetail(root, view);
  else renderUnavailable(root);
}

const ENABLE_MESSAGES = {
  "not-standalone": "Ouvre Kleio depuis l'icône de l'écran d'accueil pour activer les notifications.",
  denied: "Les notifications sont refusées. Autorise-les dans Réglages, Notifications, Kleio.",
  full: "Kleio a atteint son nombre maximal de téléphones. Réessaie plus tard.",
  error: "Impossible d'activer les notifications. Réessaie dans un instant.",
};

async function showSetup(message = "") {
  const endpoint = await currentEndpoint();
  const status = await fetchStatus(endpoint);
  renderSetup(
    root,
    { standalone: isStandalone(), status, enabledBefore: isEnabledBefore(), message },
    {
      async onEnable() {
        const result = await enablePush();
        showSetup(result.ok ? "Notifications activées." : ENABLE_MESSAGES[result.reason]);
      },
      async onTest() {
        const ok = await sendTest(await currentEndpoint());
        showSetup(ok ? "Notification de test envoyée." : "L'envoi de test a échoué. Réactive les notifications puis réessaie.");
      },
    },
  );
}

async function route() {
  const target = parseRoute(location.hash);
  pageHeader.showSettings(target.name === "calendar");
  try {
    if (target.name === "day") await showDay(target.date);
    else if (target.name === "setup") await showSetup();
    else await showCalendar();
  } catch {
    renderOffline();
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
