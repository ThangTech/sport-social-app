import { Image, Pressable, StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import type { UserProfileDto } from "@/types/user";

type Props = {
  profile: UserProfileDto;
  postCount: number;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
};

export default function ProfileSummary({
  profile,
  postCount,
  onFollowersPress,
  onFollowingPress,
}: Props) {
  return (
    <>
      {profile.coverUrl ? (
        <Image
          source={{ uri: getFileUrl(profile.coverUrl)! }}
          style={styles.cover}
        />
      ) : null}

      <View
        style={[
          styles.profile,
          !profile.coverUrl && styles.profileWithoutCover,
        ]}
      >
        <Image
          source={
            profile.avatarUrl
              ? { uri: getFileUrl(profile.avatarUrl)! }
              : require("@/assets/images/icon.png")
          }
          style={[
            styles.avatar,
            !profile.coverUrl && styles.avatarWithoutCover,
          ]}
        />

        <AppText variant="subtitle">{profile.displayName}</AppText>
        <AppText style={styles.username}>@{profile.userName}</AppText>

        {profile.bio ? <AppText style={styles.bio}>{profile.bio}</AppText> : null}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <AppText variant="subtitle">{postCount}</AppText>
            <AppText style={styles.statLabel}>Bài viết</AppText>
          </View>

          <Pressable style={styles.statItem} onPress={onFollowersPress}>
            <AppText variant="subtitle">{profile.followerCount}</AppText>
            <AppText style={styles.statLabel}>Người theo dõi</AppText>
          </Pressable>

          <Pressable style={styles.statItem} onPress={onFollowingPress}>
            <AppText variant="subtitle">{profile.followingCount}</AppText>
            <AppText style={styles.statLabel}>Đang theo dõi</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 150,
    backgroundColor: COLORS.surfaceAlt,
  },
  profile: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  profileWithoutCover: {
    paddingTop: SPACING.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: -48,
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: COLORS.background,
    backgroundColor: COLORS.surfaceAlt,
  },
  avatarWithoutCover: {
    marginTop: 0,
  },
  username: {
    marginTop: 4,
    color: COLORS.textMuted,
  },
  bio: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  stats: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
});
