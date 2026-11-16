import { fetchDay, fetchDays } from "./api.js";
import { h } from "./dom.js";
import { parseRoute } from "./router.js";
import { addMonth } from "./format.js";
import { cascadeIn, closeSheet, openSheet, slideText } from "./transitions.js";
import { renderCalendar } from "./views/calendar.js";
import { mountHeader } from "./views/chrome.js";
import { renderDetail, renderUnavailable } from "./views/detail.js";
import { currentEndpoint, enablePush, fetchStatus, isEnabledBefore, isStandalone, sendTest } from "./push.js";
import { renderSetup } from "./views/setup.js";

const root = document.getElementById("app");
const sheet = document.getElementById("sheet");
const sheetInner = document.getElementById("sheet-inner");
// L'en-tête (nom, plume, réglages) est créé une seule fois : il ne se reconstruit jamais quand on change d'écran.
const headerBox = document.getElementById("app-header");
const pageHeader = mountHeader(headerBox);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// Cartes qui arrivent en cascade dans la feuille.
const CASCADE = "h1.large, .chips, .group, .more, .srcline, .alert, .msg";
const REFRESH_AFTER_MS = 30 * 60 * 1000;

let calendar = null; // { today, launchDate, days, monthIso, selected }
let loadedAt = 0;
let sheetOpen = false;
let selecting = false;
let chain = Promise.resolve();

function lastDayOfMonth(days, monthIso) {
  const inMonth = days.filter((d) => d.date.startsWith(monthIso));
  return inMonth.length > 0 ? inMonth[inMonth.length - 1].date : null;
}

function renderOffline(target) {
  target.replaceChildren(
    h("main", { class: "pad" }, h("p", { class: "empty" }, "Pas de connexion pour le moment. Réessaie dans un instant.")),
  );
}

/** La feuille commence juste sous l'en-tête, avec un petit liseré de calendrier visible au-dessus. */
function setSheetTop() {
  const gap = 14;
  document.documentElement.style.setProperty("--sheet-top", `${(headerBox.getBoundingClientRect().bottom + gap).toFixed(2)}px`);
}

function drawCalendar() {
  renderCalendar(root, calendar, {
    async onSelect(date) {
      if (selecting || date === calendar.selected) return;
      selecting = true;
      const dir = date > calendar.selected ? 1 : -1;
      const before = root.querySelector(".pickcard .pc");
      if (before) await slideText(before, dir, "out");
      calendar.selected = date;
      drawCalendar();
      const after = root.querySelector(".pickcard .pc");
      if (after) await slideText(after, dir, "in");
      selecting = false;
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

async function ensureCalendar() {
  if (calendar) return;
  const { today, launchDate, days } = await fetchDays();
  const monthIso = today.slice(0, 7);
  const selected = days.some((d) => d.date === today) ? today : lastDayOfMonth(days, monthIso);
  calendar = { today, launchDate, days, monthIso, selected };
  loadedAt = Date.now();
  drawCalendar();
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
    sheetInner,
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

async function fillSheet(target) {
  try {
    if (target.name === "day") {
      const view = await fetchDay(target.date);
      if (view) renderDetail(sheetInner, view);
      else renderUnavailable(sheetInner);
    } else {
      await showSetup();
    }
  } catch {
    renderOffline(sheetInner);
  }
  sheet.scrollTop = 0;
}

async function openSheetUi() {
  window.scrollTo(0, 0);
  setSheetTop();
  document.documentElement.classList.add("sheet-open");
  const opening = openSheet({ sheet, behind: root });
  cascadeIn(sheetInner, CASCADE); // les cartes arrivent pendant que la feuille monte
  await opening;
  sheetOpen = true;
}

async function closeSheetUi() {
  await closeSheet({ sheet, behind: root });
  document.documentElement.classList.remove("sheet-open");
  sheetInner.replaceChildren();
  sheetOpen = false;
}

async function route() {
  const target = parseRoute(location.hash);
  pageHeader.showSettings(target.name === "calendar");
  pageHeader.showBack(target.name !== "calendar");

  try {
    await ensureCalendar(); // le calendrier existe toujours sous la feuille, même quand on arrive par une notification
  } catch {
    renderOffline(root);
    return;
  }

  if (target.name === "calendar") {
    if (sheetOpen) await closeSheetUi();
    return;
  }

  await fillSheet(target);
  if (sheetOpen) cascadeIn(sheetInner, CASCADE); // d'un jour à un autre : la feuille reste, les cartes se renouvellent
  else await openSheetUi();
}

// Les changements d'écran s'enchaînent l'un après l'autre : un retour touché pendant une animation attend la fin de celle-ci.
function enqueueRoute() {
  chain = chain.then(route).catch(() => {});
}

window.addEventListener("hashchange", enqueueRoute);
window.addEventListener("resize", setSheetTop);
document.addEventListener("visibilitychange", () => {
  // Après un long moment en arrière-plan, le jour a pu changer : on recharge le calendrier.
  if (document.visibilityState === "visible" && !sheetOpen && calendar && Date.now() - loadedAt > REFRESH_AFTER_MS) {
    calendar = null;
    enqueueRoute();
  }
});
enqueueRoute();
