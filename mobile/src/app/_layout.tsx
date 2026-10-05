import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Href,
  Stack,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { registerForPushNotifications } from "@/services/push-notification.service";
import { NotificationType } from "@/types/notification";

SplashScreen.preventAutoHideAsync();

const PENDING_PATH_KEY = "socialsport.pendingPath";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const pendingPath = useRef<Href | null>(null);

  const rememberPendingPath = useCallback((path: Href) => {
    pendingPath.current = path;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.sessionStorage.setItem(PENDING_PATH_KEY, String(path));
    }
  }, []);

  const takePendingPath = useCallback(() => {
    const storedPath =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.sessionStorage.getItem(PENDING_PATH_KEY)
        : null;
    const destination = pendingPath.current ?? (storedPath as Href | null);

    pendingPath.current = null;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.sessionStorage.removeItem(PENDING_PATH_KEY);
    }

    return destination;
  }, []);

  useEffect(() => {
    if (!user?.id || Platform.OS === "web") return;

    void registerForPushNotifications().catch(() => undefined);
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        type?: number;
        entityId?: string;
        actorId?: string;
      };
      if (
        [
          NotificationType.PostReaction,
          NotificationType.Comment,
          NotificationType.CommentReply,
        ].includes(data.type as NotificationType) &&
        data.entityId
      )
        router.push({ pathname: "/post/[id]", params: { id: data.entityId } });
      else if (
        [
          NotificationType.GroupJoinApproved,
          NotificationType.GroupJoinRejected,
        ].includes(data.type as NotificationType) &&
        data.entityId
      )
        router.push({ pathname: "/group/[id]", params: { id: data.entityId } });
      else if (data.type === NotificationType.Follow && data.actorId)
        router.push({ pathname: "/user/[id]", params: { id: data.actorId } });
      else if (
        [
          NotificationType.CopyrightReviewPending,
          NotificationType.CopyrightConfirmed,
          NotificationType.CopyrightDismissed,
          NotificationType.CopyrightAppealResolved,
          NotificationType.CopyrightScanResolved,
        ].includes(data.type as NotificationType)
      )
        router.push("/user/copyright");
      else router.push("/notifications");
    };
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(
      async (response) => {
        if (!response) return;
        open(response);
        await Notifications.clearLastNotificationResponseAsync();
      },
    );
    return () => subscription.remove();
  }, [user?.id, router]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      rememberPendingPath(pathname as Href);
      router.replace("/(auth)/login");
      return;
    }

    if (user && inAuthGroup) {
      const destination = takePendingPath() ?? "/(tabs)";
      router.replace(destination);
    }
  }, [
    user,
    loading,
    pathname,
    segments,
    router,
    rememberPendingPath,
    takePendingPath,
  ]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="post/reactions/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/create"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/create-post/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/edit/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/members/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/banned-members/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="group/join-requests/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="user/edit-profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="user/settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="user/blocked-users"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modal/create-post"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <ActionSheetProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <RootNavigator />
        </View>
      </ActionSheetProvider>
    </AuthProvider>
  );
}
