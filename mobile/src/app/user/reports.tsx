import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getMyReports, type ReportDto } from "@/services/report.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const statusLabel = (status: number) =>
  ({ 1: "Đang chờ", 2: "Đang xem xét", 3: "Đã xử lý", 4: "Đã từ chối" })[
    status
  ] ?? "Không xác định";

const targetLabel = (targetType: number) =>
  ({ 1: "Người dùng", 2: "Bài viết", 3: "Bình luận", 4: "Nhóm" })[
    targetType
  ] ?? "Đối tượng";

export default function MyReportsScreen() {
  const [items, setItems] = useState<ReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      setItems(await getMyReports());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải báo cáo.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <AppText variant="subtitle">Báo cáo của tôi</AppText>
        <View style={styles.headerButton} />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AppText color={COLORS.textMuted}>{error}</AppText>
          <Pressable
            onPress={() => {
              setLoading(true);
              void load();
            }}
          >
            <AppText color={COLORS.primary}>Thử lại</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color={COLORS.textMuted}>
                Bạn chưa gửi báo cáo nào.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <AppText variant="label">{item.reason}</AppText>
                <View style={styles.statusBadge}>
                  <AppText color={COLORS.primary}>
                    {statusLabel(item.status)}
                  </AppText>
                </View>
              </View>
              <AppText color={COLORS.textMuted}>
                {targetLabel(item.targetType)} · {item.targetId.slice(0, 8)}…
              </AppText>
              {item.description ? (
                <AppText color={COLORS.textMuted}>{item.description}</AppText>
              ) : null}
              {item.resolutionNote ? (
                <View style={styles.resultBox}>
                  <AppText variant="label">Kết quả xử lý</AppText>
                  <AppText>{item.resolutionNote}</AppText>
                  {item.reviewedAt ? (
                    <AppText color={COLORS.textMuted}>
                      {new Date(item.reviewedAt).toLocaleString("vi-VN")}
                    </AppText>
                  ) : null}
                </View>
              ) : null}
              <AppText color={COLORS.textMuted}>
                Gửi lúc {new Date(item.createdAt).toLocaleString("vi-VN")}
              </AppText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  item: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  resultBox: {
    gap: SPACING.xs,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
});
