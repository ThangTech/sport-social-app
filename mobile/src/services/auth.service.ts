import { api } from "@/services/api";
import { saveTokens } from "@/storage/token.storage";
import { AuthResponse, AuthUser, LoginRequest } from "@/types/auth";

export const login = async (request: LoginRequest) => {
  const response = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });

  await saveTokens(response.accessToken, response.refreshToken);

  return response;
};

export const getMe = async () => {
  return await api<AuthUser>("/auth/me", {
    method: "GET",
    auth: true,
  });
};