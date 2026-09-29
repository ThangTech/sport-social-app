import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { registerDeviceToken, unregisterDeviceToken } from "./notification.service";

const tokenStorageKey = "expoPushToken";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice || (Platform.OS !== "ios" && Platform.OS !== "android")) return null;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", { name: "Thông báo SocialSport", importance: Notifications.AndroidImportance.DEFAULT });
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return null;
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const platform = Platform.OS as "ios" | "android";
  await registerDeviceToken(token, platform);
  await SecureStore.setItemAsync(tokenStorageKey, token);
  return token;
}

export async function unregisterCurrentPushToken() {
  const token = await SecureStore.getItemAsync(tokenStorageKey);
  if (!token || (Platform.OS !== "ios" && Platform.OS !== "android")) return;
  try { await unregisterDeviceToken(token, Platform.OS); } finally { await SecureStore.deleteItemAsync(tokenStorageKey); }
}
