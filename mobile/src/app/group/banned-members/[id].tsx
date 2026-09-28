import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  getBannedGroupMembers,
  getGroupById,
  unbanGroupMember,
} from "@/services/group.service";
import type { GroupDto, GroupMemberDto } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BannedGroupMembersScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const processingUserIdRef = useRef<string | null>(null);

  const loadData = useCallback(
    async (showLoading = true) => {
      if (!id) {
        setErrorMessage("Không tìm thấy nhóm.");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        setErrorMessage("");

        const [groupResult, membersResult] = await Promise.all([
          getGroupById(id),
          getBannedGroupMembers(id),
        ]);

        setGroup(groupResult);
        setMembers(membersResult);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách thành viên bị cấm.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const handleUnban = async (member: GroupMemberDto) => {
    if (!id || processingUserIdRef.current) return;

    try {
      processingUserIdRef.current = member.userId;
      setProcessingUserId(member.userId);
      await unbanGroupMember(id, member.userId);
    } catch (error) {
      Alert.alert(
        "Không thể bỏ cấm",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      await loadData(false);
      processingUserIdRef.current = null;
      setProcessingUserId(null);
    }
  };

  const confirmUnban = (member: GroupMemberDto) => {
    if (processingUserIdRef.current) return;

    Alert.alert(
      "Bỏ cấm thành viên",
      `${member.displayName} có thể tham gia hoặc gửi yêu cầu lại, nhưng sẽ không tự động trở lại danh sách thành viên.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ cấm",
          onPress: () => handleUnban(member),
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
        <AppText variant="subtitle">Thành viên bị cấm</AppText>
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
          <Pressable style={styles.retryButton} onPress={() => loadData()}>
            <AppText variant="label" color={COLORS.background}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={
            members.length === 0 ? styles.emptyList : undefined
          }
          ListHeaderComponent={
            group ? (
              <View style={styles.listHeader}>
                <AppText variant="label">{group.name}</AppText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="ban-outline" size={50} color={COLORS.textMuted} />
              <AppText color={COLORS.textMuted} style={styles.message}>
                Không có thành viên nào đang bị cấm.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const isProcessing = processingUserId === item.userId;

            return (
              <View style={styles.memberItem}>
                <Pressable
                  style={styles.identity}
                  onPress={() =>
                    router.push({
                      pathname: "/user/[id]",
                      params: { id: item.userId },
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
                    <AppText variant="label" numberOfLines={1}>
                      {item.displayName}
                    </AppText>
                    <AppText
                      variant="caption"
                      color={COLORS.textMuted}
                      numberOfLines={1}
                    >
                      @{item.userName}
                    </AppText>
                  </View>
                </Pressable>

                <Pressable
                  disabled={processingUserId !== null}
                  onPress={() => confirmUnban(item)}
                  style={[
                    styles.unbanButton,
                    processingUserId !== null && styles.disabledButton,
                  ]}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <AppText variant="label" color={COLORS.primary}>
                      Bỏ cấm
                    </AppText>
                  )}
                </Pressable>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
  listHeader: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  memberItem: {
    minHeight: 84,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  userInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  unbanButton: {
    minWidth: 84,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  center: {
    flex: 1,
    padding: SPACING.xl,
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
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.55,
  },
});
