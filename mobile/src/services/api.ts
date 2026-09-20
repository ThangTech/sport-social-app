import { getAccessToken } from "@/storage/token.storage";
import { ApiError } from "@/types/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL chưa được cấu hình.");
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export const api = async <T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> => {
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
    let errors: Record<string, string[]> | undefined;

    try {
      const data = await response.json();

      console.log("API ERROR:", response.status, data);

      message = data.detail || data.message || data.title || message;

      if (data.errors && typeof data.errors === "object") {
        errors = data.errors;
      }
    } catch (error) {
      console.log("Cannot parse API error:", error);
    }

    throw new ApiError(message, response.status, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
};
