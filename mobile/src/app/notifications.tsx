import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import type { NotificationDto } from "@/types/notification";
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

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const loadingMoreRef = useRef(false);

  const load = useCallback(async (cursor: string | null = null, append = false) => {
    try {
      if (!append) setErrorMessage("");
      const response = await getNotifications(PAGE_SIZE, cursor);
      setItems((current) => append
        ? [...current, ...response.items.filter((item) => !current.some((old) => old.id === item.id))]
        : response.items);
      setNextCursor(response.nextCursor ?? null);
    } catch (error) {
      if (!append) setItems([]);
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải thông báo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openNotification = async (item: NotificationDto) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setItems((current) => current.map((value) => value.id === item.id ? { ...value, isRead: true } : value));
      }
      if (item.postId) router.push({ pathname: "/post/[id]", params: { id: item.postId } });
      else if (item.groupId) router.push({ pathname: "/group/[id]", params: { id: item.groupId } });
      else if (item.copyrightReviewId) router.push("/user/copyright");
      else if (item.actorId) router.push({ pathname: "/user/[id]", params: { id: item.actorId } });
    } catch (error) {
      Alert.alert("Không thể mở thông báo", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      Alert.alert("Không thể đánh dấu đã đọc", error instanceof Error ? error.message : "Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <AppText variant="subtitle">Thông báo</AppText>
        <Pressable style={styles.headerButton} onPress={markAllRead} disabled={!items.some((item) => !item.isRead)}>
          <Ionicons name="checkmark-done" size={22} color={items.some((item) => !item.isRead) ? COLORS.primary : COLORS.textMuted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : errorMessage && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={COLORS.textMuted} />
          <AppText color={COLORS.textMuted} style={styles.centerText}>{errorMessage}</AppText>
          <Pressable style={styles.retryButton} onPress={() => { setLoading(true); void load(); }}>
            <AppText variant="label" color={COLORS.background}>Thử lại</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
              <AppText variant="subtitle">Chưa có thông báo</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={[styles.item, !item.isRead && styles.unreadItem]} onPress={() => void openNotification(item)}>
              <Avatar source={item.actorAvatarUrl
                ? { uri: getFileUrl(item.actorAvatarUrl)! }
                : require("../../assets/images/icon.png")} />
              <View style={styles.itemContent}>
                <AppText>{item.message}</AppText>
                <AppText variant="caption" color={COLORS.textMuted}>{new Date(item.createdAt).toLocaleString("vi-VN")}</AppText>
              </View>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          )}
          ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator color={COLORS.primary} /></View> : null}
          onEndReached={() => {
            if (!nextCursor || loadingMoreRef.current) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
            void load(nextCursor, true);
          }}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 64, paddingHorizontal: SPACING.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, minHeight: 240, padding: SPACING.xl, alignItems: "center", justifyContent: "center", gap: SPACING.md },
  centerText: { textAlign: "center" },
  retryButton: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  item: { minHeight: 76, padding: SPACING.md, flexDirection: "row", alignItems: "center", gap: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  unreadItem: { backgroundColor: COLORS.surfaceAlt },
  itemContent: { flex: 1, gap: SPACING.xs },
  unreadDot: { width: 9, height: 9, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  footer: { padding: SPACING.lg, alignItems: "center" },
});
