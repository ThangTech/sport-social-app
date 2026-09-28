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
import { Image, StyleSheet, View } from "react-native";

type GroupSummaryProps = {
  group: GroupDto;
};

const getRoleLabel = (role?: GroupMemberRole | null) => {
  if (role === GroupMemberRole.Admin) return "Quản trị viên";
  if (role === GroupMemberRole.Moderator) return "Kiểm duyệt viên";
  return "Thành viên";
};

export default function GroupSummary({ group }: GroupSummaryProps) {
  const isPrivate = group.privacy === GroupPrivacy.Private;
  const isPending =
    group.currentUserMemberStatus === GroupMemberStatus.Pending;
  const joinLabel = isPending
    ? "Đang chờ duyệt"
    : isPrivate
      ? "Yêu cầu tham gia"
      : "Tham gia nhóm";

  return (
    <View style={styles.container}>
      <View style={styles.cover}>
        {group.coverUrl ? (
          <Image
            source={{ uri: getFileUrl(group.coverUrl)! }}
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
              source={{ uri: getFileUrl(group.avatarUrl)! }}
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

        {group.isMember ? (
          <View style={styles.memberBadge}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            <AppText variant="label" color={COLORS.primary}>
              {getRoleLabel(group.currentUserRole)}
            </AppText>
          </View>
        ) : (
          <View style={[styles.joinButton, isPending && styles.pendingButton]}>
            <Ionicons
              name={isPending ? "time-outline" : "person-add-outline"}
              size={18}
              color={isPending ? COLORS.textMuted : COLORS.background}
            />
            <AppText
              variant="label"
              color={isPending ? COLORS.textMuted : COLORS.background}
            >
              {joinLabel}
            </AppText>
          </View>
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
  pendingButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
});
