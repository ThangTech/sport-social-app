import { api } from "@/services/api";
import { saveTokens } from "@/storage/token.storage";
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  MessageResponse,
  ResetPasswordRequest,
} from "@/types/auth";

export const login = async (request: LoginRequest) => {
  const response = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });

  await saveTokens(response.accessToken, response.refreshToken);

  return response;
};
export const register = async (request: RegisterRequest) => {
  return await api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
};
export const forgotPassword = async (request: ForgotPasswordRequest) => {
  return await api<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
};
export const resetPassword = async (request: ResetPasswordRequest) => {
  return await api<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(request),
  });
};
export const getMe = async () => {
  return await api<AuthUser>("/auth/me", {
    method: "GET",
    auth: true,
  });
};
