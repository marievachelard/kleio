import { describe, expect, test } from "vitest";
import { isAllowedPushEndpoint } from "../src/endpoints";

describe("isAllowedPushEndpoint", () => {
  test.each([
    "https://web.push.apple.com/QAbc123",
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://db5p.notify.windows.com/?token=abc",
  ])("accepte %s", (url) => {
    expect(isAllowedPushEndpoint(url)).toBe(true);
  });

  test.each([
    ["http au lieu de https", "http://web.push.apple.com/abc"],
    ["hôte inconnu", "https://exemple.org/push"],
    ["adresse locale", "https://localhost/push"],
    ["adresse IP", "https://169.254.169.254/latest"],
    ["sous-domaine trompeur", "https://web.push.apple.com.evil.com/x"],
    ["identifiants dans l'adresse", "https://web.push.apple.com@evil.com/x"],
    ["texte qui n'est pas une adresse", "pas une url"],
    ["vide", ""],
  ])("refuse %s", (_label, url) => {
    expect(isAllowedPushEndpoint(url)).toBe(false);
  });
});
