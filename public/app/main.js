import { fetchDay, fetchDays } from "./api.js";
import { h } from "./dom.js";
import { addMonth } from "./format.js";
import { renderCalendar } from "./views/calendar.js";
import { header } from "./views/chrome.js";
import { renderDetail, renderUnavailable } from "./views/detail.js";

const root = document.getElementById("app");

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

async function showHome() {
  const { today, days } = await fetchDays();
  if (days.some((d) => d.date === today)) {
    location.replace(`#/day/${today}`);
  } else {
    location.replace("#/calendar");
  }
}

async function route() {
  const hash = location.hash;
  try {
    const dayMatch = /^#\/day\/(\d{4}-\d{2}-\d{2})$/.exec(hash);
    if (dayMatch) await showDay(dayMatch[1]);
    else if (hash === "#/calendar") await showCalendar();
    else await showHome();
  } catch {
    renderOffline();
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
