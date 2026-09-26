import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getBlockedUsers, unblockUser } from "@/services/user.service";
import type { UserSummaryDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BlockedUsersScreen() {
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await getBlockedUsers();
      setUsers(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách tài khoản đã chặn.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  const handleUnblock = async (user: UserSummaryDto) => {
    if (unblockingId) return;

    try {
      setUnblockingId(user.id);
      await unblockUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (error) {
      Alert.alert(
        "Không thể bỏ chặn",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setUnblockingId(null);
    }
  };

  const confirmUnblock = (user: UserSummaryDto) => {
    if (unblockingId) return;

    Alert.alert(
      "Bỏ chặn người dùng",
      `Bạn có chắc muốn bỏ chặn ${user.displayName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ chặn",
          onPress: () => handleUnblock(user),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Tài khoản đã chặn</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải danh sách...
          </AppText>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.textMuted}
          />
          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
          <Pressable style={styles.retryButton} onPress={loadUsers}>
            <AppText variant="label" color={COLORS.background}>
              Thử lại
            </AppText>
          </Pressable>
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
                name="ban-outline"
                size={50}
                color={COLORS.textMuted}
              />
              <AppText color={COLORS.textMuted} style={styles.message}>
                Bạn chưa chặn tài khoản nào.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const isUnblocking = unblockingId === item.id;

            return (
              <Pressable
                style={styles.userItem}
                onPress={() =>
                  router.push({
                    pathname: "/user/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <Image
                  source={
                    item.avatarUrl
                      ? { uri: getFileUrl(item.avatarUrl)! }
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

                <Pressable
                  disabled={Boolean(unblockingId)}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    confirmUnblock(item);
                  }}
                  style={[
                    styles.unblockButton,
                    unblockingId && styles.disabledButton,
                  ]}
                >
                  {isUnblocking ? (
                    <ActivityIndicator size="small" color={COLORS.text} />
                  ) : (
                    <AppText variant="label">Bỏ chặn</AppText>
                  )}
                </Pressable>
              </Pressable>
            );
          }}
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  userItem: {
    minHeight: 76,
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
  unblockButton: {
    minWidth: 88,
    minHeight: 38,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
  },
  disabledButton: {
    opacity: 0.6,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  message: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
});
