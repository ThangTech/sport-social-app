import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getFollowers, getFollowing } from "@/services/user.service";
import type { UserSummaryDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserConnectionsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    type?: string | string[];
  }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const type = Array.isArray(params.type) ? params.type[0] : params.type;

  const isFollowers = type === "followers";

  const [users, setUsers] = useState<UserSummaryDto[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      if (!id) {
        setErrorMessage("Không tìm thấy người dùng.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        const result = isFollowers
          ? await getFollowers(id)
          : await getFollowing(id);

        setUsers(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải danh sách.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [id, isFollowers]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">
          {isFollowers ? "Người theo dõi" : "Đang theo dõi"}
        </AppText>

        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={COLORS.textMuted}
          />

          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            users.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="people-outline"
                size={50}
                color={COLORS.textMuted}
              />

              <AppText color={COLORS.textMuted} style={styles.message}>
                {isFollowers
                  ? "Chưa có người theo dõi."
                  : "Chưa theo dõi người dùng nào."}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.userItem}
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: {
                    id: item.id,
                  },
                })
              }
            >
              <Image
                source={
                  item.avatarUrl
                    ? {
                        uri: getFileUrl(item.avatarUrl)!,
                      }
                    : require("@/assets/images/icon.png")
                }
                style={styles.avatar}
              />

              <View style={styles.userInfo}>
                <AppText variant="label">{item.displayName}</AppText>

                <AppText variant="caption" color={COLORS.textMuted}>
                  @{item.userName}
                </AppText>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 64,
    paddingHorizontal: SPACING.lg,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpace: {
    width: 40,
  },

  userItem: {
    minHeight: 72,
    paddingHorizontal: SPACING.lg,

    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceAlt,
  },

  userInfo: {
    flex: 1,
    gap: 3,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyList: {
    flexGrow: 1,
  },

  message: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
});
