export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = response.statusText || "Request failed";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // response had no JSON body
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
