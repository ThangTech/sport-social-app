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
  canRemove: boolean;
  canBan: boolean;
  actionLoading: boolean;
  actionsDisabled: boolean;
  onProfilePress: () => void;
  onChangeRole: (role: GroupMemberRole) => void;
  onRemove: () => void;
  onBan: () => void;
};

type MemberAction =
  | { type: "role"; label: string; role: GroupMemberRole }
  | { type: "remove"; label: string }
  | { type: "ban"; label: string };

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
  canRemove,
  canBan,
  actionLoading,
  actionsDisabled,
  onProfilePress,
  onChangeRole,
  onRemove,
  onBan,
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

  const confirmRemove = () => {
    Alert.alert(
      "Xóa khỏi nhóm",
      `${member.displayName} sẽ không còn là thành viên nhưng có thể tham gia hoặc gửi yêu cầu lại sau này.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa khỏi nhóm",
          style: "destructive",
          onPress: onRemove,
        },
      ],
    );
  };

  const confirmBan = () => {
    Alert.alert(
      "Cấm khỏi nhóm",
      `${member.displayName} sẽ bị xóa khỏi danh sách thành viên và không thể tham gia lại cho đến khi được bỏ cấm.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Cấm khỏi nhóm",
          style: "destructive",
          onPress: onBan,
        },
      ],
    );
  };

  const openActionMenu = () => {
    if (actionsDisabled) return;

    const actions: MemberAction[] = availableRoles.map((role) => ({
      type: "role",
      label: `Đổi thành ${getGroupRoleLabel(role)}`,
      role,
    }));

    if (canRemove) actions.push({ type: "remove", label: "Xóa khỏi nhóm" });
    if (canBan) actions.push({ type: "ban", label: "Cấm khỏi nhóm" });
    if (actions.length === 0) return;

    const options = [...actions.map((action) => action.label), "Hủy"];
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = actions.reduce<number[]>(
      (indexes, action, index) => {
        if (action.type === "remove" || action.type === "ban") {
          indexes.push(index);
        }
        return indexes;
      },
      [],
    );

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: `Quản lý ${member.displayName}`,
      },
      (index) => {
        if (index === undefined || index === cancelButtonIndex) return;

        const action = actions[index];
        if (action.type === "role") confirmRoleChange(action.role);
        if (action.type === "remove") confirmRemove();
        if (action.type === "ban") confirmBan();
      },
    );
  };

  const hasActions = availableRoles.length > 0 || canRemove || canBan;

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

      {hasActions ? (
        <Pressable
          disabled={actionsDisabled}
          onPress={openActionMenu}
          style={[
            styles.actionButton,
            actionsDisabled && styles.disabledButton,
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <>
              <Ionicons
                name="ellipsis-horizontal"
                size={17}
                color={COLORS.text}
              />
              <AppText variant="caption">Quản lý</AppText>
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
  actionButton: {
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
