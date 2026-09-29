const API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const tokenKey = "adminAccessToken";

export function apiFileUrl(path: string): string {
  if (!API_URL) {
    return path;
  }

  return new URL(path, API_URL).toString();
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) throw new Error("VITE_API_URL chưa được cấu hình.");
  const token = localStorage.getItem(tokenKey);
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem(tokenKey);
    window.dispatchEvent(new Event("admin-session-expired"));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.detail ||
        body?.title ||
        (response.status === 403
          ? "Tài khoản không có quyền System Admin."
          : "Yêu cầu thất bại."),
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
