import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { MOCK_POSTS, MOCK_USERS } from "@/data/mock-data";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const user = MOCK_USERS.find((item) => item.id === id);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <AppText variant="subtitle">Không tìm thấy người dùng</AppText>

          <View style={styles.headerSpace} />
        </View>
      </SafeAreaView>
    );
  }

  const userPosts = MOCK_POSTS.filter((post) => post.authorId === user.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Trang cá nhân</AppText>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView>
        <View style={styles.profile}>
          <Image source={user.avatar} style={styles.avatar} />

          <AppText variant="subtitle">{user.name}</AppText>

          <AppText style={styles.username}>@{user.username}</AppText>

          <AppText style={styles.bio}>{user.bio}</AppText>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <AppText variant="subtitle">{userPosts.length}</AppText>

              <AppText style={styles.statLabel}>Bài viết</AppText>
            </View>

            <View style={styles.statItem}>
              <AppText variant="subtitle">{user.followerCount}</AppText>

              <AppText style={styles.statLabel}>Người theo dõi</AppText>
            </View>

            <View style={styles.statItem}>
              <AppText variant="subtitle">{user.followingCount}</AppText>

              <AppText style={styles.statLabel}>Đang theo dõi</AppText>
            </View>
          </View>

          <Pressable style={styles.followButton}>
            <Ionicons
              name="person-add-outline"
              size={18}
              color={COLORS.background}
            />

            <AppText style={styles.followText}>Theo dõi</AppText>
          </Pressable>
        </View>

        <View style={styles.postsSection}>
          <AppText variant="subtitle">Bài viết</AppText>

          <AppText variant="caption" color={COLORS.textMuted}>
            {userPosts.length} bài viết
          </AppText>
        </View>
      </ScrollView>
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

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpace: {
    width: 40,
  },

  profile: {
    alignItems: "center",
    padding: SPACING.xl,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: SPACING.md,
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
    marginTop: SPACING.xl,

    flexDirection: "row",
    justifyContent: "space-around",
  },

  statItem: {
    alignItems: "center",
  },

  statLabel: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 13,
  },

  followButton: {
    marginTop: SPACING.xl,

    paddingHorizontal: 28,
    paddingVertical: 10,

    borderRadius: 24,
    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  followText: {
    color: COLORS.background,
    fontWeight: "600",
  },

  postsSection: {
    padding: SPACING.lg,

    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,

    gap: SPACING.xs,
  },
});
