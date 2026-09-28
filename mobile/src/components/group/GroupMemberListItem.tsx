import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { GroupMemberRole, type GroupMemberDto } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type GroupMemberListItemProps = {
  member: GroupMemberDto;
  isOwner: boolean;
  availableRoles: GroupMemberRole[];
  actionLoading: boolean;
  actionsDisabled: boolean;
  onProfilePress: () => void;
  onChangeRole: (role: GroupMemberRole) => void;
};

export const getGroupRoleLabel = (
  role: GroupMemberRole,
  isOwner = false,
) => {
  if (isOwner) return "Chủ nhóm";
  if (role === GroupMemberRole.Admin) return "Quản trị viên nhóm";
  if (role === GroupMemberRole.Moderator) return "Kiểm duyệt viên";
  return "Thành viên";
};

export default function GroupMemberListItem({
  member,
  isOwner,
  availableRoles,
  actionLoading,
  actionsDisabled,
  onProfilePress,
  onChangeRole,
}: GroupMemberListItemProps) {
  const { showActionSheetWithOptions } = useActionSheet();

  const confirmRoleChange = (role: GroupMemberRole) => {
    const roleLabel = getGroupRoleLabel(role);

    Alert.alert(
      "Đổi vai trò",
      `Bạn có chắc muốn đổi vai trò của ${member.displayName} thành ${roleLabel}?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xác nhận", onPress: () => onChangeRole(role) },
      ],
    );
  };

  const openRoleMenu = () => {
    if (actionsDisabled || availableRoles.length === 0) return;

    const options = [
      ...availableRoles.map((role) => getGroupRoleLabel(role)),
      "Hủy",
    ];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: `Đổi vai trò của ${member.displayName}`,
      },
      (index) => {
        if (index === undefined || index === cancelButtonIndex) return;

        confirmRoleChange(availableRoles[index]);
      },
    );
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.identity} onPress={onProfilePress}>
        <Image
          source={
            member.avatarUrl
              ? { uri: getFileUrl(member.avatarUrl)! }
              : require("@/assets/images/icon.png")
          }
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <AppText variant="label" numberOfLines={1}>
            {member.displayName}
          </AppText>
          <AppText variant="caption" color={COLORS.textMuted} numberOfLines={1}>
            @{member.userName}
          </AppText>
          <View style={styles.roleBadge}>
            <AppText variant="caption" color={COLORS.primary}>
              {getGroupRoleLabel(member.role, isOwner)}
            </AppText>
          </View>
        </View>
      </Pressable>

      {availableRoles.length > 0 ? (
        <Pressable
          disabled={actionsDisabled}
          onPress={openRoleMenu}
          style={[
            styles.roleButton,
            actionsDisabled && styles.disabledButton,
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <>
              <Ionicons
                name="shield-outline"
                size={17}
                color={COLORS.text}
              />
              <AppText variant="caption">Đổi vai trò</AppText>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
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
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  userInfo: {
    flex: 1,
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  roleButton: {
    minHeight: 38,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  disabledButton: {
    opacity: 0.55,
  },
});
