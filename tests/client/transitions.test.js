// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EASE, cascadeIn, closeSheet, openSheet, slideText } from "../../public/app/transitions.js";

function fakeEl() {
  const calls = [];
  const el = {
    hidden: true,
    style: {},
    calls,
    animate: vi.fn((frames, opts) => {
      calls.push({ frames, opts });
      return { finished: Promise.resolve(), cancel: vi.fn() };
    }),
  };
  return el;
}

function stubReducedMotion(reduce) {
  vi.stubGlobal("matchMedia", () => ({ matches: reduce }));
}

beforeEach(() => stubReducedMotion(false));
afterEach(() => vi.unstubAllGlobals());

describe("openSheet (la feuille monte)", () => {
  test("la feuille monte depuis le bas et l'écran derrière recule en s'estompant, en 520 ms", async () => {
    const sheet = fakeEl();
    const behind = fakeEl();
    await openSheet({ sheet, behind });
    expect(sheet.hidden).toBe(false);
    expect(sheet.animate).toHaveBeenCalledTimes(1);
    const s = sheet.calls[0];
    expect(s.frames).toEqual([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }]);
    expect(s.opts).toMatchObject({ duration: 520, easing: EASE, fill: "both" });
    const b = behind.calls[0];
    expect(b.frames[0]).toEqual({ transform: "scale(1) translateY(0)", opacity: 1 });
    expect(b.frames[1]).toEqual({ transform: "scale(.94) translateY(8px)", opacity: 0.5 });
    expect(b.opts.duration).toBe(520);
  });

  test("à la fin, l'écran derrière garde son état reculé, sans réagir au toucher", async () => {
    const sheet = fakeEl();
    const behind = fakeEl();
    await openSheet({ sheet, behind });
    expect(behind.style.transform).toBe("scale(.94) translateY(8px)");
    expect(behind.style.opacity).toBe("0.5");
    expect(behind.style.pointerEvents).toBe("none");
  });
});

describe("closeSheet (descente douce)", () => {
  test("la feuille descend à peine en s'effaçant (34 px, 300 ms) pendant que le calendrier reprend sa place (440 ms)", async () => {
    const sheet = fakeEl();
    const behind = fakeEl();
    behind.style = { transform: "scale(.94) translateY(8px)", opacity: "0.5", pointerEvents: "none" };
    await closeSheet({ sheet, behind });
    const s = sheet.calls[0];
    expect(s.frames).toEqual([
      { transform: "translateY(0)", opacity: 1 },
      { transform: "translateY(34px)", opacity: 0 },
    ]);
    expect(s.opts.duration).toBe(300);
    expect(s.opts.easing).toBe("cubic-bezier(.4,0,.7,1)");
    const b = behind.calls[0];
    expect(b.frames).toEqual([
      { transform: "scale(.94) translateY(8px)", opacity: 0.5 },
      { transform: "scale(1) translateY(0)", opacity: 1 },
    ]);
    expect(b.opts.duration).toBe(440);
  });

  test("ce n'est jamais un balayage : la feuille ne descend pas jusqu'en bas de l'écran", async () => {
    const sheet = fakeEl();
    const behind = fakeEl();
    await closeSheet({ sheet, behind });
    const end = sheet.calls[0].frames[1].transform;
    expect(end).not.toContain("%");
  });

  test("à la fin, la feuille est masquée et l'écran derrière est rendu propre (plus de style inline)", async () => {
    const sheet = fakeEl();
    sheet.hidden = false;
    const behind = fakeEl();
    behind.style = { transform: "scale(.94) translateY(8px)", opacity: "0.5", pointerEvents: "none" };
    await closeSheet({ sheet, behind });
    expect(sheet.hidden).toBe(true);
    expect(behind.style.transform).toBe("");
    expect(behind.style.opacity).toBe("");
    expect(behind.style.pointerEvents).toBe("");
  });
});

describe("cascadeIn (cartes en cascade)", () => {
  test("chaque carte monte en s'éclaircissant, l'une après l'autre (70 ms d'écart, 160 ms de départ)", () => {
    document.body.innerHTML = '<div id="r"><h1 class="large"></h1><section class="group"></section><section class="group"></section><div class="more"></div></div>';
    const root = document.getElementById("r");
    const els = [...root.querySelectorAll(".large, .group, .more")];
    els.forEach((el) => {
      el.calls = [];
      el.animate = vi.fn((frames, opts) => {
        el.calls.push({ frames, opts });
        return { finished: Promise.resolve(), cancel() {} };
      });
    });
    const anims = cascadeIn(root, ".large, .group, .more");
    expect(anims).toHaveLength(4);
    els.forEach((el, i) => {
      expect(el.calls[0].frames).toEqual([
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ]);
      expect(el.calls[0].opts.duration).toBe(480);
      expect(el.calls[0].opts.delay).toBe(160 + i * 70);
    });
  });

  test("avec « réduire les animations », tout apparaît instantanément", () => {
    stubReducedMotion(true);
    document.body.innerHTML = '<div id="r"><section class="group"></section></div>';
    const el = document.querySelector(".group");
    el.animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }));
    cascadeIn(document.getElementById("r"), ".group");
    expect(el.animate.mock.calls[0][1]).toMatchObject({ duration: 0, delay: 0 });
  });
});

describe("slideText (texte qui glisse)", () => {
  test("vers un jour plus tard, le texte sort vers la gauche puis le nouveau arrive de la droite", async () => {
    const el = fakeEl();
    await slideText(el, 1, "out");
    expect(el.calls[0].frames).toEqual([
      { transform: "translateX(0)", opacity: 1 },
      { transform: "translateX(-18px)", opacity: 0 },
    ]);
    expect(el.calls[0].opts.duration).toBe(130);
    await slideText(el, 1, "in");
    expect(el.calls[1].frames).toEqual([
      { transform: "translateX(18px)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 },
    ]);
    expect(el.calls[1].opts.duration).toBe(260);
  });

  test("vers un jour plus tôt, le sens est inversé", async () => {
    const el = fakeEl();
    await slideText(el, -1, "out");
    expect(el.calls[0].frames[1].transform).toBe("translateX(18px)");
    await slideText(el, -1, "in");
    expect(el.calls[1].frames[0].transform).toBe("translateX(-18px)");
  });
});

describe("réduire les animations", () => {
  test("ouvrir et fermer la feuille se font sans durée", async () => {
    stubReducedMotion(true);
    const sheet = fakeEl();
    const behind = fakeEl();
    await openSheet({ sheet, behind });
    await closeSheet({ sheet, behind });
    for (const c of [...sheet.calls, ...behind.calls]) expect(c.opts.duration).toBe(0);
  });
});
