const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL chưa được cấu hình.");
}

export const api = async <T>(
  endpoint: string,
  options: RequestInit = {},): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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
