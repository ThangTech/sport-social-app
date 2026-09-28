import GroupMemberListItem from "@/components/group/GroupMemberListItem";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGroupById,
  getGroupMembers,
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
    ? [
        GroupMemberRole.Member,
        GroupMemberRole.Moderator,
        GroupMemberRole.Admin,
      ]
    : [GroupMemberRole.Member, GroupMemberRole.Moderator];

  return allowedRoles.filter((role) => role !== member.role);
};

export default function GroupMembersScreen() {
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [members, setMembers] = useState<GroupMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const updatingUserIdRef = useRef<string | null>(null);

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

  const handleChangeRole = async (
    member: GroupMemberDto,
    role: GroupMemberRole,
  ) => {
    if (!id || updatingUserIdRef.current) return;

    try {
      updatingUserIdRef.current = member.userId;
      setUpdatingUserId(member.userId);

      await updateGroupMemberRole(id, member.userId, { role });
    } catch (error) {
      Alert.alert(
        "Không thể đổi vai trò",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      await loadData(false);
      updatingUserIdRef.current = null;
      setUpdatingUserId(null);
    }
  };

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
              <AppText variant="label">{group.name}</AppText>
              <AppText variant="caption" color={COLORS.textMuted}>
                {group.memberCount} thành viên
              </AppText>
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
              availableRoles={getAvailableRoles(
                item,
                group,
                currentUser?.id,
              )}
              actionLoading={updatingUserId === item.userId}
              actionsDisabled={updatingUserId !== null}
              onProfilePress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: item.userId },
                })
              }
              onChangeRole={(role) => handleChangeRole(item, role)}
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
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
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
