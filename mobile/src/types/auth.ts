export type AuthUser = {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  roles: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};
export type RegisterRequest = {
  userName: string;
  email: string;
  displayName: string;
  password: string;
};
export type ForgotPasswordRequest = {
  email: string;
};

export type MessageResponse = {
  message: string;
};
export type ResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
};
