import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  GroupMemberRole,
  GroupMemberStatus,
  GroupPrivacy,
  type GroupDto,
} from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type GroupSummaryProps = {
  group: GroupDto;
  isOwner: boolean;
  membershipLoading: boolean;
  canManageJoinRequests: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onEdit: () => void;
  onViewMembers: () => void;
  onManageJoinRequests: () => void;
};

const getRoleLabel = (role?: GroupMemberRole | null) => {
  if (role === GroupMemberRole.Admin) return "Quản trị viên";
  if (role === GroupMemberRole.Moderator) return "Kiểm duyệt viên";
  return "Thành viên";
};

export default function GroupSummary({
  group,
  isOwner,
  membershipLoading,
  canManageJoinRequests,
  onJoin,
  onLeave,
  onEdit,
  onViewMembers,
  onManageJoinRequests,
}: GroupSummaryProps) {
  const isPrivate = group.privacy === GroupPrivacy.Private;
  const membershipStatus = group.currentUserMemberStatus ?? null;
  const isPending = membershipStatus === GroupMemberStatus.Pending;
  const isActive = membershipStatus === GroupMemberStatus.Active;
  const isBanned = membershipStatus === GroupMemberStatus.Banned;
  const joinLabel = isPrivate ? "Gửi yêu cầu tham gia" : "Tham gia nhóm";

  return (
    <View style={styles.container}>
      <View style={styles.cover}>
        {group.coverUrl ? (
          <Image
            source={{
              uri: getFileUrl(
                group.coverUrl,
                group.updatedAt ?? group.createdAt,
              )!,
            }}
            style={styles.coverImage}
          />
        ) : (
          <Ionicons name="people" size={54} color={COLORS.textMuted} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.identityRow}>
          {group.avatarUrl ? (
            <Image
              source={{
                uri: getFileUrl(
                  group.avatarUrl,
                  group.updatedAt ?? group.createdAt,
                )!,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="people" size={34} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.identity}>
            <AppText variant="title">{group.name}</AppText>
            <View style={styles.metaRow}>
              <Ionicons
                name={isPrivate ? "lock-closed" : "globe-outline"}
                size={14}
                color={COLORS.textMuted}
              />
              <AppText variant="caption" color={COLORS.textMuted}>
                {isPrivate ? "Nhóm riêng tư" : "Nhóm công khai"}
              </AppText>
              <AppText variant="caption" color={COLORS.textMuted}>
                · {group.memberCount} thành viên
              </AppText>
            </View>
          </View>
        </View>

        {group.description ? (
          <AppText color={COLORS.textMuted}>{group.description}</AppText>
        ) : null}

        <AppText variant="caption" color={COLORS.textMuted}>
          Quản lý bởi {group.ownerName}
        </AppText>

        <Pressable
          onPress={onViewMembers}
          style={({ pressed }) => [
            styles.requestMenu,
            pressed && styles.disabledButton,
          ]}
        >
          <View style={styles.requestMenuLabel}>
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <AppText variant="label">Thành viên</AppText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>

        {isOwner ? (
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [
              styles.requestMenu,
              pressed && styles.disabledButton,
            ]}
          >
            <View style={styles.requestMenuLabel}>
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORS.primary}
              />
              <AppText variant="label">Chỉnh sửa nhóm</AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        ) : null}

        {canManageJoinRequests ? (
          <Pressable
            onPress={onManageJoinRequests}
            style={({ pressed }) => [
              styles.requestMenu,
              pressed && styles.disabledButton,
            ]}
          >
            <View style={styles.requestMenuLabel}>
              <Ionicons
                name="person-add-outline"
                size={20}
                color={COLORS.primary}
              />
              <AppText variant="label">Yêu cầu tham gia</AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
        ) : null}

        {isOwner ? (
          <View style={styles.memberBadge}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <AppText variant="label" color={COLORS.primary}>
              Chủ nhóm
            </AppText>
          </View>
        ) : isBanned ? (
          <View style={styles.bannedBadge}>
            <Ionicons name="ban-outline" size={18} color={COLORS.danger} />
            <AppText variant="label" color={COLORS.danger}>
              Bạn đã bị cấm khỏi nhóm
            </AppText>
          </View>
        ) : isPending ? (
          <View style={styles.membershipActions}>
            <View style={styles.pendingButton}>
              <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
              <AppText variant="label" color={COLORS.textMuted}>
                Đã gửi yêu cầu
              </AppText>
            </View>
            <Pressable
              disabled={membershipLoading}
              onPress={onLeave}
              style={({ pressed }) => [
                styles.cancelButton,
                (pressed || membershipLoading) && styles.disabledButton,
              ]}
            >
              {membershipLoading ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <AppText variant="label" color={COLORS.danger}>
                  Hủy yêu cầu
                </AppText>
              )}
            </Pressable>
          </View>
        ) : isActive ? (
          <View style={styles.membershipActions}>
            <View style={styles.memberBadge}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <AppText variant="label" color={COLORS.primary}>
                {getRoleLabel(group.currentUserRole)}
              </AppText>
            </View>
            <Pressable
              disabled={membershipLoading}
              onPress={onLeave}
              style={({ pressed }) => [
                styles.leaveButton,
                (pressed || membershipLoading) && styles.disabledButton,
              ]}
            >
              {membershipLoading ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <AppText variant="label" color={COLORS.danger}>
                  Rời nhóm
                </AppText>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={membershipLoading}
            onPress={onJoin}
            style={({ pressed }) => [
              styles.joinButton,
              (pressed || membershipLoading) && styles.disabledButton,
            ]}
          >
            {membershipLoading ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={COLORS.background}
                />
                <AppText variant="label" color={COLORS.background}>
                  {joinLabel}
                </AppText>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cover: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.background,
    backgroundColor: COLORS.surfaceAlt,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
  },
  identity: {
    flex: 1,
    gap: SPACING.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  memberBadge: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  joinButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  membershipActions: {
    gap: SPACING.sm,
  },
  pendingButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  leaveButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  bannedBadge: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  requestMenu: {
    minHeight: 52,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  requestMenuLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
