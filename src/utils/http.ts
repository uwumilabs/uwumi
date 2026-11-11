export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`Request failed with status ${status}: ${url}`);
  }
}

// fetch itself only rejects on network errors, so these throw an HttpError on a non-2xx status
const fetchOk = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) throw new HttpError(response.status, url);
  return response;
};

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> =>
  (await (await fetchOk(url, init)).json()) as T;

export const fetchText = async (url: string, init?: RequestInit) => (await fetchOk(url, init)).text();
