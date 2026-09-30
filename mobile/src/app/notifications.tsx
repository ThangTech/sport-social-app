import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  deleteAllNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import {
  NotificationType,
  type NotificationDto,
} from "@/types/notification";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
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
const postNotificationTypes = new Set([
  NotificationType.PostReaction,
  NotificationType.Comment,
  NotificationType.CommentReply,
]);
const groupNotificationTypes = new Set([
  NotificationType.GroupInvite,
  NotificationType.GroupJoinApproved,
  NotificationType.GroupJoinRejected,
]);

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (cursor: string | null = null, append = false) => {
      try {
        if (!append) {
          setErrorMessage("");
        }

        const response = await getNotifications(PAGE_SIZE, cursor);
        setItems((current) => {
          if (!append) {
            return response.items;
          }

          const existingIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...response.items.filter((item) => !existingIds.has(item.id)),
          ];
        });
        setNextCursor(response.nextCursor ?? null);
      } catch (error) {
        if (!append) {
          setItems([]);
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải thông báo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const markReadLocally = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              isRead: true,
            }
          : item,
      ),
    );
  };

  const openNotification = async (item: NotificationDto) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        markReadLocally(item.id);
      }

      if (postNotificationTypes.has(item.type)) {
        if (!item.postId) {
          Alert.alert(
            "Nội dung không còn khả dụng",
            "Bài viết đã bị xóa hoặc quyền xem của bạn đã thay đổi.",
          );
          return;
        }

        router.push({
          pathname: "/post/[id]",
          params: {
            id: item.postId,
          },
        });
        return;
      }

      if (groupNotificationTypes.has(item.type)) {
        if (!item.groupId) {
          Alert.alert(
            "Không thể mở nhóm",
            "Nhóm không còn khả dụng hoặc bạn không còn quyền truy cập.",
          );
          return;
        }

        router.push({
          pathname: "/group/[id]",
          params: {
            id: item.groupId,
          },
        });
        return;
      }

      if (item.copyrightReviewId) {
        router.push("/user/copyright");
        return;
      }

      if (item.actorId) {
        router.push({
          pathname: "/user/[id]",
          params: {
            id: item.actorId,
          },
        });
      }
    } catch (error) {
      Alert.alert(
        "Không thể mở thông báo",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    }
  };

  const markAllRead = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      await markAllNotificationsRead();
      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );
    } catch (error) {
      Alert.alert(
        "Không thể đánh dấu đã đọc",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteAll = () => {
    if (items.length === 0 || actionLoading) return;

    Alert.alert(
      "Xóa toàn bộ thông báo",
      "Hành động này chỉ xóa thông báo của tài khoản hiện tại và không thể hoàn tác.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: () => void deleteAll(),
        },
      ],
    );
  };

  const deleteAll = async () => {
    try {
      setActionLoading(true);
      await deleteAllNotifications();
      setItems([]);
      setNextCursor(null);
    } catch (error) {
      Alert.alert(
        "Không thể xóa thông báo",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <AppText variant="subtitle">Thông báo</AppText>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={() => void markAllRead()}
            disabled={
              actionLoading || !items.some((item) => !item.isRead)
            }
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color={
                items.some((item) => !item.isRead)
                  ? COLORS.primary
                  : COLORS.textMuted
              }
            />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={confirmDeleteAll}
            disabled={actionLoading || items.length === 0}
          >
            <Ionicons
              name="trash-outline"
              size={21}
              color={items.length > 0 ? COLORS.danger : COLORS.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : errorMessage && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
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
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={COLORS.textMuted}
              />
              <AppText variant="subtitle">Chưa có thông báo</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, !item.isRead && styles.unreadItem]}
              onPress={() => void openNotification(item)}
            >
              <Avatar
                source={
                  item.actorAvatarUrl
                    ? {
                        uri: getFileUrl(item.actorAvatarUrl)!,
                      }
                    : require("../../assets/images/icon.png")
                }
              />
              <View style={styles.itemContent}>
                <AppText>{item.message}</AppText>
                {item.targetTitle ? (
                  <View style={styles.targetContext}>
                    <AppText variant="label" color={COLORS.primary}>
                      {item.targetTitle}
                    </AppText>
                    {item.targetPreview ? (
                      <AppText
                        variant="caption"
                        color={COLORS.textMuted}
                        numberOfLines={2}
                      >
                        {item.targetPreview}
                      </AppText>
                    ) : null}
                  </View>
                ) : null}
                <AppText variant="caption" color={COLORS.textMuted}>
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </AppText>
              </View>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null
          }
          onEndReached={() => {
            if (!nextCursor || loadingMoreRef.current) return;

            loadingMoreRef.current = true;
            setLoadingMore(true);
            void load(nextCursor, true);
          }}
          onEndReachedThreshold={0.4}
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
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    minHeight: 240,
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
  item: {
    minHeight: 76,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  unreadItem: {
    backgroundColor: COLORS.surfaceAlt,
  },
  itemContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  targetContext: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
    gap: 2,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: "center",
  },
});
