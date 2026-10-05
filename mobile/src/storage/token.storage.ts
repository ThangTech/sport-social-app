import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "accessTokenExpiresAt";
const REFRESH_TOKEN_EXPIRES_AT_KEY = "refreshTokenExpiresAt";
const WEB_KEY_PREFIX = "socialsport.";

const getWebStorage = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const setItem = async (key: string, value: string) => {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(`${WEB_KEY_PREFIX}${key}`, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(`${WEB_KEY_PREFIX}${key}`);
  }

  return await SecureStore.getItemAsync(key);
};

const deleteItem = async (key: string) => {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(`${WEB_KEY_PREFIX}${key}`);
    return;
  }

  await SecureStore.deleteItemAsync(key);
};

export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt?: string,
  refreshTokenExpiresAt?: string,
) => {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);

  if (accessTokenExpiresAt) {
    await setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, accessTokenExpiresAt);
  }

  if (refreshTokenExpiresAt) {
    await setItem(REFRESH_TOKEN_EXPIRES_AT_KEY, refreshTokenExpiresAt);
  }
};

export const getAccessToken = async () => {
  return await getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return await getItem(REFRESH_TOKEN_KEY);
};

export const getAccessTokenExpiresAt = async () => {
  return await getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
};

export const clearTokens = async () => {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  await deleteItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
};
