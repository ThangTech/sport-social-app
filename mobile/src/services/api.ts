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

    const rawBody = await response.text();

    console.log("API ERROR STATUS:", response.status);
    console.log("API ERROR BODY:", rawBody);

    if (rawBody) {
      try {
        const data = JSON.parse(rawBody);

        if (data.errors && typeof data.errors === "object") {
          errors = data.errors;
          message = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else {
          message = data.detail || data.message || data.title || message;
        }
      } catch {
        message = rawBody;
      }
    } else {
      if (response.status === 400) {
        message = "Yêu cầu không hợp lệ.";
      } else if (response.status === 401) {
        message = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
      } else if (response.status === 403) {
        message = "Bạn không có quyền thực hiện thao tác này.";
      } else if (response.status === 404) {
        message = "Không tìm thấy dữ liệu.";
      } else if (response.status >= 500) {
        message = "Máy chủ đang gặp lỗi. Vui lòng thử lại.";
      }
    }
    throw new ApiError(message, response.status, errors);
  }
  return await response.json();
};
