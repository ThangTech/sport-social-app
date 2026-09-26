import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";

export default function AppHeader() {
  const { user } = useAuth();

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

          {/* Chưa có notification API thì chưa hiện badge giả */}
        </Pressable>

        <Pressable onPress={() => router.push("/user/settings")}>
          <Avatar
            source={
              user?.avatarUrl
                ? {
                    uri: getFileUrl(user.avatarUrl)!,
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
});
