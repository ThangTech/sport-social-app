import { useTheme } from "@/contexts/ThemeContext";
import GroupMemberListItem from "@/components/group/GroupMemberListItem";
import AppText from "@/components/ui/AppText";
import { RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  banGroupMember,
  getGroupById,
  getGroupMembers,
  removeGroupMember,
  updateGroupMemberRole,
} from "@/services/group.service";
import {
  GroupMemberRole,
  type GroupDto,
  type GroupMemberDto,
} from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getAvailableRoles = (
  member: GroupMemberDto,
  group: GroupDto,
  currentUserId?: string,
) => {
  if (!currentUserId) return [];
  if (member.userId === group.ownerId || member.userId === currentUserId) {
    return [];
  }

  const isOwner = currentUserId === group.ownerId;
  const isGroupAdmin = group.currentUserRole === GroupMemberRole.Admin;

  if (!isOwner && !isGroupAdmin) return [];
  if (!isOwner && member.role === GroupMemberRole.Admin) return [];

  const allowedRoles = isOwner
    ? [GroupMemberRole.Member, GroupMemberRole.Moderator, GroupMemberRole.Admin]
    : [GroupMemberRole.Member, GroupMemberRole.Moderator];

  return allowedRoles.filter((role) => role !== member.role);
};

const canManageMember = (
  member: GroupMemberDto,
  group: GroupDto,
  currentUserId?: string,
) => {
  if (!currentUserId) return false;
  if (member.userId === group.ownerId || member.userId === currentUserId) {
    return false;
  }

  if (currentUserId === group.ownerId) return true;
  if (group.currentUserRole === GroupMemberRole.Admin) {
    return member.role !== GroupMemberRole.Admin;
  }

  return (
    group.currentUserRole === GroupMemberRole.Moderator &&
    member.role === GroupMemberRole.Member
  );
};

type MemberAction = "role" | "remove" | "ban";

export default function GroupMembersScreen() {
  const { colors: COLORS } = useTheme();
  const styles = createStyles(COLORS);
  const { user: currentUser } = useAuth();
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
          getGroupMembers(id),
        ]);

        setGroup(groupResult);
        setMembers(membersResult);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách thành viên.",
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

  const processMember = async (
    member: GroupMemberDto,
    action: MemberAction,
    role?: GroupMemberRole,
  ) => {
    if (!id || processingUserIdRef.current) return;

    try {
      processingUserIdRef.current = member.userId;
      setProcessingUserId(member.userId);

      if (action === "role" && role !== undefined) {
        await updateGroupMemberRole(id, member.userId, { role });
      } else if (action === "remove") {
        await removeGroupMember(id, member.userId);
      } else if (action === "ban") {
        await banGroupMember(id, member.userId);
      }
    } catch (error) {
      const title =
        action === "role"
          ? "Không thể đổi vai trò"
          : action === "remove"
            ? "Không thể xóa thành viên"
            : "Không thể cấm thành viên";

      Alert.alert(
        title,
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      await loadData(false);
      processingUserIdRef.current = null;
      setProcessingUserId(null);
    }
  };

  const canViewBannedMembers =
    group &&
    currentUser &&
    (currentUser.id === group.ownerId ||
      group.currentUserRole === GroupMemberRole.Admin);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Thành viên</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải thành viên...
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
      ) : group ? (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={
            members.length === 0 ? styles.emptyList : undefined
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.groupInfo}>
                <AppText variant="label">{group.name}</AppText>
                <AppText variant="caption" color={COLORS.textMuted}>
                  {group.memberCount} thành viên
                </AppText>
              </View>

              {canViewBannedMembers ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/group/banned-members/[id]",
                      params: { id: group.id },
                    })
                  }
                  style={styles.bannedMembersButton}
                >
                  <View style={styles.bannedMembersLabel}>
                    <Ionicons
                      name="ban-outline"
                      size={20}
                      color={COLORS.danger}
                    />
                    <AppText variant="label">Thành viên bị cấm</AppText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="people-outline"
                size={50}
                color={COLORS.textMuted}
              />
              <AppText color={COLORS.textMuted} style={styles.message}>
                Nhóm chưa có thành viên nào.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <GroupMemberListItem
              member={item}
              isOwner={item.userId === group.ownerId}
              availableRoles={getAvailableRoles(item, group, currentUser?.id)}
              canRemove={canManageMember(item, group, currentUser?.id)}
              canBan={canManageMember(item, group, currentUser?.id)}
              actionLoading={processingUserId === item.userId}
              actionsDisabled={processingUserId !== null}
              onProfilePress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: item.userId },
                })
              }
              onChangeRole={(role) => processMember(item, "role", role)}
              onRemove={() => processMember(item, "remove")}
              onBan={() => processMember(item, "ban")}
            />
          )}
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
      ) : null}
    </SafeAreaView>
  );
}

const createStyles = (COLORS: typeof import("@/constants/theme").COLORS) =>
  StyleSheet.create({
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
      gap: SPACING.md,
      backgroundColor: COLORS.surface,
    },
    groupInfo: {
      gap: SPACING.xs,
    },
    bannedMembersButton: {
      minHeight: 48,
      paddingHorizontal: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.surfaceAlt,
    },
    bannedMembersLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
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
  });
