type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Renvoie null si le lien répond en 2xx (après redirections), sinon un message d'erreur. */
export async function checkUrl(url: string, fetchFn: FetchLike = fetch): Promise<string | null> {
  try {
    let res = await fetchFn(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetchFn(url, { method: "GET", redirect: "follow" });
    }
    return res.status >= 200 && res.status < 300 ? null : `${url} : statut ${res.status}`;
  } catch (e) {
    return `${url} : ${(e as Error).message}`;
  }
}
