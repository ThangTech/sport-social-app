import { getAccessToken } from "@/storage/token.storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL chưa được cấu hình.");
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export const api = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = await getAccessToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Có lỗi xảy ra.";

    try {
      const data = await response.json();
      message = data.detail || data.title || data.message || message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
};