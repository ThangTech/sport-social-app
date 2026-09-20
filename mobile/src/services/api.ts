import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/storage/token.storage";
import { ApiError } from "@/types/api";
import { AuthResponse } from "@/types/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL chưa được cấu hình.");
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    await clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      await clearTokens();
      return null;
    }

    const data: AuthResponse = await response.json();

    await saveTokens(data.accessToken, data.refreshToken);

    return data.accessToken;
  } catch {
    return null;
  }
};

const getNewAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return await refreshPromise;
};

const createApiError = async (response: Response) => {
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
      message = "Phiên đăng nhập đã hết hạn.";
    } else if (response.status === 403) {
      message = "Bạn không có quyền thực hiện thao tác này.";
    } else if (response.status === 404) {
      message = "Không tìm thấy dữ liệu.";
    } else if (response.status >= 500) {
      message = "Máy chủ đang gặp lỗi. Vui lòng thử lại.";
    }
  }

  return new ApiError(message, response.status, errors);
};

export const api = async <T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> => {
  const buildHeaders = async (tokenOverride?: string) => {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (options.auth) {
      const token = tokenOverride || (await getAccessToken());

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return headers;
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: await buildHeaders(),
  });

  if (response.status === 401 && options.auth) {
    console.log("ACCESS TOKEN EXPIRED → REFRESHING");

    const newAccessToken = await getNewAccessToken();

    if (newAccessToken) {
      console.log("REFRESH SUCCESS → RETRY REQUEST");

      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: await buildHeaders(newAccessToken),
      });
    } else {
      console.log("REFRESH FAILED → LOGOUT");

      await clearTokens();
      unauthorizedHandler?.();

      throw new ApiError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
      );
    }
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
};
