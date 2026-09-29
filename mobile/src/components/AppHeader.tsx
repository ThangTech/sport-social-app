import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getUnreadNotificationCount } from "@/services/notification.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

export default function AppHeader() {
  const { user, profileImageVersion } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    void getUnreadNotificationCount().then((result) => setUnreadCount(result.count)).catch(() => setUnreadCount(0));
  }, [user?.id]));

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <AppText
          variant="subtitle"
          color={COLORS.primary}
          style={styles.brandName}
        >
          SocialSport
        </AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => {
            // Search sẽ triển khai sau.
          }}
        >
          <Ionicons name="search-outline" size={24} color={COLORS.text} />
        </Pressable>

        <Pressable
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.text}
          />

          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <AppText variant="caption" color={COLORS.background} style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={() => router.push("/user/settings")}>
          <Avatar
            source={
              user?.avatarUrl
                ? {
                    uri: getFileUrl(user.avatarUrl, profileImageVersion)!,
                  }
                : require("../../assets/images/icon.png")
            }
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,

    paddingHorizontal: SPACING.lg,

    backgroundColor: COLORS.background,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.sm,
  },

  logo: {
    width: 38,
    height: 38,

    borderRadius: RADIUS.md,
  },

  brandName: {
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.xs,
  },

  iconButton: {
    width: 40,
    height: 40,

    borderRadius: RADIUS.full,

    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 1,
    right: 0,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
