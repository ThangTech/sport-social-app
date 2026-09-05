import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Pressable, StyleSheet, View, Image } from "react-native";
import AppText from "./ui/AppText";
import Avatar from "./Avatar";
import { router } from "expo-router";
export default function AppHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <AppText variant="subtitle">
          Bảng tin
        </AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => Alert.alert("Tìm kiếm")}
        >
          <Ionicons
            name="search-outline"
            size={24}
            color={COLORS.text}
          />
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

          <View style={styles.badge}>
            <AppText variant="caption" color={COLORS.white}>
              2
            </AppText>
          </View>
        </Pressable>

        <Avatar source={require("../../assets/images/icon.png")} />
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
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
    right: 1,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
});