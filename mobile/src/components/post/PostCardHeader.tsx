import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Avatar from "@/components/Avatar";
import SportBadge from "@/components/SportBadge";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import type { Post } from "@/types/post";

type Props = {
  post: Post;
  isOwner: boolean;
  onAuthorPress?: () => void;
  onMenuPress: () => void;
};

export default function PostCardHeader({
  post,
  isOwner,
  onAuthorPress,
  onMenuPress,
}: Props) {
  const visibilityIcon =
    post.visibility === 1
      ? "earth-outline"
      : post.visibility === 2
        ? "people-outline"
        : "lock-closed-outline";

  return (
    <View style={styles.header}>
      <Pressable
        style={styles.userInfo}
        disabled={!onAuthorPress}
        onPress={onAuthorPress}
      >
        <Avatar source={post.authorAvatar} />
        <View style={styles.author}>
          <AppText variant="label"> {post.authorName}</AppText>
          {post.groupName ? (
            <AppText
              variant="caption"
              color={COLORS.primary}
              style={styles.groupName}
            >
              {post.groupName}
            </AppText>
          ) : null}
          <View style={styles.postMeta}>
            <AppText variant="caption" color={COLORS.textMuted}>
              {post.createdAt}
            </AppText>
            <View style={styles.metaDot} />
            <Ionicons
              name={visibilityIcon}
              size={13}
              color={COLORS.textMuted}
            />
          </View>
        </View>
      </Pressable>

      <View style={styles.headerActions}>
        {post.sport ? <SportBadge name={post.sport} /> : null}
        {isOwner ? (
          <Pressable hitSlop={10} onPress={onMenuPress}>
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={COLORS.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  author: {
    flex: 1,
  },
  groupName: {
    marginLeft: 2,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  postMeta: {
    marginLeft: 2,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
});
