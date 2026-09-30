import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  approveGroupPost,
  getGroupPostReviewQueue,
  rejectGroupPost,
} from "@/services/group.service";
import type { FeedPostDto } from "@/types/feed";
import { formatRelativeTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupPostReviewQueueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const groupId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [posts, setPosts] = useState<FeedPostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const processingRef = useRef(false);

  const load = useCallback(async () => {
    if (!groupId) {
      setErrorMessage("Không tìm thấy nhóm.");
      setLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      setPosts(await getGroupPostReviewQueue(groupId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải hàng đợi duyệt bài.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const processPost = async (
    post: FeedPostDto,
    action: "approve" | "reject",
  ) => {
    if (!groupId || processingRef.current) return;

    try {
      processingRef.current = true;
      setProcessingId(post.id);
      if (action === "approve") {
        await approveGroupPost(groupId, post.id);
      } else {
        await rejectGroupPost(groupId, post.id);
      }

      setPosts((current) =>
        current.filter((item) => item.id !== post.id),
      );
    } catch (error) {
      Alert.alert(
        action === "approve" ? "Không thể duyệt bài" : "Không thể từ chối bài",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
      await load();
    } finally {
      processingRef.current = false;
      setProcessingId(null);
    }
  };

  const confirmReject = (post: FeedPostDto) => {
    Alert.alert(
      "Từ chối bài viết",
      "Bài sẽ không xuất hiện trong nhóm và tác giả sẽ nhận được thông báo.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: () => void processPost(post, "reject"),
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
        <AppText variant="subtitle">Hàng đợi duyệt bài</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted}>Đang tải bài chờ duyệt...</AppText>
        </View>
      ) : errorMessage && posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.textMuted}
          />
          <AppText color={COLORS.textMuted} style={styles.centerText}>
            {errorMessage}
          </AppText>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              void load();
            }}
          >
            <AppText variant="label" color={COLORS.background}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={COLORS.primary}
              />
              <AppText variant="caption" color={COLORS.textMuted}>
                Duyệt của nhóm và kiểm tra bản quyền là hai lớp độc lập. Bài đã
                được duyệt vẫn có thể tạm ẩn nếu media đang chờ kiểm tra.
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="shield-checkmark-outline"
                size={56}
                color={COLORS.textMuted}
              />
              <AppText variant="subtitle">Không có bài chờ duyệt</AppText>
              <AppText color={COLORS.textMuted} style={styles.centerText}>
                Các bài mới của thành viên sẽ xuất hiện tại đây.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const image = item.media.find((media) => media.mediaType === 1);
            const video = item.media.find((media) => media.mediaType === 2);
            const processing = processingId === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.authorRow}>
                  <Avatar
                    source={
                      item.authorAvatar
                        ? {
                            uri: getFileUrl(item.authorAvatar)!,
                          }
                        : require("../../../../assets/images/icon.png")
                    }
                  />
                  <View style={styles.authorText}>
                    <AppText variant="label">{item.authorName}</AppText>
                    <AppText variant="caption" color={COLORS.textMuted}>
                      {formatRelativeTime(item.createdAt)}
                    </AppText>
                  </View>
                  {item.sportName ? (
                    <View style={styles.sportBadge}>
                      <AppText variant="caption" color={COLORS.primary}>
                        {item.sportName}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                <AppText>{item.content}</AppText>
                {image ? (
                  <Image
                    source={{
                      uri: getFileUrl(image.url)!,
                    }}
                    resizeMode="cover"
                    style={styles.image}
                  />
                ) : video ? (
                  <Pressable
                    style={styles.videoPlaceholder}
                    onPress={() =>
                      void Linking.openURL(getFileUrl(video.url)!)
                    }
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={32}
                      color={COLORS.textMuted}
                    />
                    <AppText variant="caption" color={COLORS.textMuted}>
                      Mở video để kiểm tra
                    </AppText>
                  </Pressable>
                ) : null}

                <View style={styles.actions}>
                  <Pressable
                    disabled={processing}
                    onPress={() => confirmReject(item)}
                    style={[styles.actionButton, styles.rejectButton]}
                  >
                    <AppText variant="label" color={COLORS.danger}>
                      Từ chối
                    </AppText>
                  </Pressable>
                  <Pressable
                    disabled={processing}
                    onPress={() => void processPost(item, "approve")}
                    style={[styles.actionButton, styles.approveButton]}
                  >
                    {processing ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.background}
                      />
                    ) : (
                      <AppText variant="label" color={COLORS.background}>
                        Duyệt đăng
                      </AppText>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  center: {
    flex: 1,
    minHeight: 260,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  centerText: {
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  notice: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  card: {
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    gap: SPACING.md,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  authorText: {
    flex: 1,
  },
  sportBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  videoPlaceholder: {
    height: 120,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  approveButton: {
    backgroundColor: COLORS.primary,
  },
});
