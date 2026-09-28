import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { GroupPrivacy, type GroupDto } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, View } from "react-native";

type GroupListItemProps = {
  group: GroupDto;
  onPress: () => void;
};

export default function GroupListItem({
  group,
  onPress,
}: GroupListItemProps) {
  const isPrivate = group.privacy === GroupPrivacy.Private;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {group.avatarUrl ? (
        <Image
          source={{ uri: getFileUrl(group.avatarUrl)! }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="people" size={30} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="label" numberOfLines={1} style={styles.name}>
            {group.name}
          </AppText>

          <View style={styles.privacyBadge}>
            <Ionicons
              name={isPrivate ? "lock-closed" : "globe-outline"}
              size={12}
              color={COLORS.textMuted}
            />
            <AppText variant="caption" color={COLORS.textMuted}>
              {isPrivate ? "Riêng tư" : "Công khai"}
            </AppText>
          </View>
        </View>

        {group.description ? (
          <AppText
            variant="caption"
            color={COLORS.textMuted}
            numberOfLines={2}
          >
            {group.description}
          </AppText>
        ) : null}

        <AppText variant="caption" color={COLORS.textMuted}>
          {group.memberCount} thành viên
        </AppText>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
  },
  content: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  name: {
    flex: 1,
  },
  privacyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
});
