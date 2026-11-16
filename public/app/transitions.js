// Mouvements de Kleio : une feuille qui monte pour le détail et les réglages, un retour en « descente douce »,
// des cartes en cascade et un texte qui glisse. Tout devient instantané si le téléphone demande de réduire les animations.

export const EASE = "cubic-bezier(.22,.9,.28,1)";
const SOFT = "cubic-bezier(.4,0,.7,1)";

function reduced() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ms(n) {
  return reduced() ? 0 : n;
}

const NOW = { finished: Promise.resolve(), cancel() {} };

export function play(el, frames, { duration = 460, delay = 0, easing = EASE } = {}) {
  if (!el || typeof el.animate !== "function") return NOW;
  return el.animate(frames, { duration: ms(duration), delay: ms(delay), easing, fill: "both" });
}

/** La feuille monte depuis le bas ; l'écran derrière recule en s'estompant et garde cet état tant que la feuille est ouverte. */
export async function openSheet({ sheet, behind }) {
  sheet.hidden = false;
  const a = play(sheet, [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], { duration: 520 });
  const b = play(
    behind,
    [
      { transform: "scale(1) translateY(0)", opacity: 1 },
      { transform: "scale(.94) translateY(8px)", opacity: 0.5 },
    ],
    { duration: 520 },
  );
  await Promise.all([a.finished, b.finished]);
  behind.style.transform = "scale(.94) translateY(8px)";
  behind.style.opacity = "0.5";
  behind.style.pointerEvents = "none";
  a.cancel();
  b.cancel();
}

/** « Descente douce » : la feuille s'efface en descendant à peine, pendant que l'écran derrière reprend sa place. */
export async function closeSheet({ sheet, behind }) {
  behind.style.transform = "";
  behind.style.opacity = "";
  behind.style.pointerEvents = "";
  const a = play(
    sheet,
    [
      { transform: "translateY(0)", opacity: 1 },
      { transform: "translateY(34px)", opacity: 0 },
    ],
    { duration: 300, easing: SOFT },
  );
  const b = play(
    behind,
    [
      { transform: "scale(.94) translateY(8px)", opacity: 0.5 },
      { transform: "scale(1) translateY(0)", opacity: 1 },
    ],
    { duration: 440 },
  );
  await Promise.all([a.finished, b.finished]);
  sheet.hidden = true;
  a.cancel();
  b.cancel();
}

/** Les cartes arrivent l'une après l'autre : elles montent de 18 px en s'éclaircissant. */
export function cascadeIn(root, selector, { delay = 160, step = 70 } = {}) {
  return [...root.querySelectorAll(selector)].map((el, i) =>
    play(
      el,
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 480, delay: delay + i * step },
    ),
  );
}

/** Le texte de la carte glisse dans le sens du temps : `dir` vaut 1 vers un jour plus tard, -1 vers un jour plus tôt. */
export function slideText(el, dir, phase) {
  const frames =
    phase === "out"
      ? [
          { transform: "translateX(0)", opacity: 1 },
          { transform: `translateX(${-18 * dir}px)`, opacity: 0 },
        ]
      : [
          { transform: `translateX(${18 * dir}px)`, opacity: 0 },
          { transform: "translateX(0)", opacity: 1 },
        ];
  return play(el, frames, phase === "out" ? { duration: 130, easing: "ease-in" } : { duration: 260 }).finished;
}
