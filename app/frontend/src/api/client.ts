export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error ?? `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

const resolveApiURL = (url: string) => {
  const apiUrl = import.meta.env.API_URL || "http://localhost";
  const apiPort = import.meta.env.API_PORT || "5173";
  return `${apiUrl}:${apiPort}${url}`;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(resolveApiURL(url), { credentials: "include" });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(resolveApiURL(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json() as Promise<T>;
}

export async function apiPostVoid(url: string, body?: unknown): Promise<void> {
  const res = await fetch(resolveApiURL(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) throw new ApiError(await parseError(res), res.status);
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(resolveApiURL(url), { method: "DELETE", credentials: "include" });
  if (!res.ok && res.status !== 204) throw new ApiError(await parseError(res), res.status);
}
