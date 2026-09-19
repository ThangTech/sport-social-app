export type AuthUser = {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
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