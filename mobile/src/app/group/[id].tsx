import PostCard from "@/components/PostCard";
import GroupSummary from "@/components/group/GroupSummary";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import {
  getGroupById,
  getGroupPosts,
  joinGroup,
  leaveGroup,
} from "@/services/group.service";
import { ApiError } from "@/types/api";
import { GroupMemberStatus, type GroupDto } from "@/types/group";
import type { Post } from "@/types/post";
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

const PAGE_SIZE = 20;

export default function GroupDetailScreen() {
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [postsErrorMessage, setPostsErrorMessage] = useState("");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const currentGroupIdRef = useRef<string | undefined>(id);
  const loadingMoreRef = useRef(false);
  const membershipLoadingRef = useRef(false);

  const loadPosts = useCallback(
    async (
      groupId: string,
      cursor: string | null = null,
      append = false,
    ) => {
      try {
        if (!append) setPostsErrorMessage("");

        const response = await getGroupPosts(groupId, PAGE_SIZE, cursor);

        if (currentGroupIdRef.current !== groupId) return;

        const mappedPosts = response.items.map(mapFeedPostToPost);

        setPosts((current) => {
          if (!append) return mappedPosts;

          const existingIds = new Set(current.map((post) => post.id));
          const newPosts = mappedPosts.filter(
            (post) => !existingIds.has(post.id),
          );
          return [...current, ...newPosts];
        });
        setNextCursor(response.nextCursor ?? null);
      } catch (error) {
        if (currentGroupIdRef.current !== groupId) return;

        if (!append) {
          setPosts([]);
        } else {
          setNextCursor(null);
        }

        setPostsErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải bài viết của nhóm.",
        );
      } finally {
        if (currentGroupIdRef.current === groupId) {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [],
  );

  const loadGroup = useCallback(
    async (groupId: string) => {
      try {
        setErrorMessage("");

        const result = await getGroupById(groupId);

        if (currentGroupIdRef.current !== groupId) return;

        setGroup(result);
        await loadPosts(groupId);
      } catch (error) {
        if (currentGroupIdRef.current !== groupId) return;

        setGroup(null);
        setPosts([]);
        setErrorMessage(
          error instanceof ApiError && error.status === 404
            ? "Không tìm thấy nhóm."
            : error instanceof Error
              ? error.message
              : "Không thể tải thông tin nhóm.",
        );
      } finally {
        if (currentGroupIdRef.current === groupId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [loadPosts],
  );

  useFocusEffect(
    useCallback(() => {
      currentGroupIdRef.current = id;

      if (!id) {
        setErrorMessage("Không tìm thấy nhóm.");
        setLoading(false);
        return;
      }

      setLoading(true);
      loadGroup(id);
    }, [id, loadGroup]),
  );

  const handleRefresh = () => {
    if (!id) return;

    setRefreshing(true);
    loadGroup(id);
  };

  const handleLoadMore = () => {
    if (
      !id ||
      !nextCursor ||
      loading ||
      refreshing ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    loadPosts(id, nextCursor, true);
  };

  const updateMembership = async (action: "join" | "leave") => {
    if (!id || membershipLoadingRef.current) return;

    try {
      membershipLoadingRef.current = true;
      setMembershipLoading(true);

      if (action === "join") {
        await joinGroup(id);
      } else {
        await leaveGroup(id);
      }

      await loadGroup(id);
    } catch (error) {
      Alert.alert(
        action === "join"
          ? "Không thể tham gia nhóm"
          : "Không thể rời nhóm",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      membershipLoadingRef.current = false;
      setMembershipLoading(false);
    }
  };

  const handleLeave = () => {
    if (!group || membershipLoadingRef.current) return;

    const isPending =
      group.currentUserMemberStatus === GroupMemberStatus.Pending;

    Alert.alert(
      isPending ? "Hủy yêu cầu tham gia" : "Rời nhóm",
      isPending
        ? "Bạn có chắc muốn hủy yêu cầu tham gia nhóm này?"
        : "Bạn có chắc muốn rời khỏi nhóm này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: isPending ? "Hủy yêu cầu" : "Rời nhóm",
          style: "destructive",
          onPress: () => updateMembership("leave"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Chi tiết nhóm</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải thông tin nhóm...
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
          {id ? (
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                loadGroup(id);
              }}
            >
              <AppText variant="label" color={COLORS.background}>
                Thử lại
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : group ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <GroupSummary
                group={group}
                isOwner={currentUser?.id === group.ownerId}
                membershipLoading={membershipLoading}
                onJoin={() => updateMembership("join")}
                onLeave={handleLeave}
              />

              <View style={styles.sectionHeader}>
                <AppText variant="subtitle">Bài viết trong nhóm</AppText>
              </View>

              {postsErrorMessage ? (
                <View style={styles.postsError}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={24}
                    color={COLORS.textMuted}
                  />
                  <AppText color={COLORS.textMuted} style={styles.errorText}>
                    {postsErrorMessage}
                  </AppText>
                </View>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !postsErrorMessage ? (
              <View style={styles.emptyPosts}>
                <AppText color={COLORS.textMuted}>
                  Nhóm chưa có bài viết nào.
                </AppText>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() =>
                router.push({
                  pathname: "/post/[id]",
                  params: { id: item.id },
                })
              }
              onCommentPress={() =>
                router.push({
                  pathname: "/post/[id]",
                  params: { id: item.id },
                })
              }
              onAuthorPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: item.authorId },
                })
              }
              onDeleted={(postId) =>
                setPosts((current) =>
                  current.filter((post) => post.id !== postId),
                )
              }
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
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
  center: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
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
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  postsError: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  errorText: {
    textAlign: "center",
  },
  emptyPosts: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  footer: {
    padding: SPACING.lg,
    alignItems: "center",
  },
});
