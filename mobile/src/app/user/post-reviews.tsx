import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AppText from "@/components/ui/AppText";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/services/api";

type ReviewItem = {
  id: string;
  content: string;
  status: number;
  systemModerationStatus: number;
  systemModerationReason?: string | null;
  createdAt: string;
};

const reviewLabels: Record<number, string> = {
  0: "Chưa duyệt",
  1: "Chờ System Admin duyệt",
  2: "Đã duyệt",
  3: "Đã từ chối / gỡ",
  4: "Chưa hoàn tất tải media",
};

export default function MyPostReviewsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(
        await api<ReviewItem[]>(`/posts/reviews/mine?page=${page}`, {
          auth: true,
        }),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không tải được bài viết.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}
    >
      <Pressable onPress={() => router.back()} style={{ paddingVertical: 12 }}>
        <AppText color={colors.primary}>Quay lại</AppText>
      </Pressable>
      <AppText variant="title">Trạng thái bài viết</AppText>
      <AppText color={colors.textMuted}>
        Bài ngoài nhóm chỉ hiển thị sau khi System Admin duyệt.
      </AppText>
      {error ? <AppText color={colors.danger}>{error}</AppText> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <FlatList
        data={items}
        refreshing={loading}
        onRefresh={() => void load()}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading ? <AppText>Chưa có bài viết.</AppText> : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              marginTop: 12,
              backgroundColor: colors.surface,
              borderRadius: 12,
              gap: 8,
            }}
          >
            <AppText>{item.content}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {reviewLabels[item.systemModerationStatus]}
            </AppText>
            {item.systemModerationReason && (
              <AppText>Lý do: {item.systemModerationReason}</AppText>
            )}
            {item.status === 1 && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/post/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <AppText color={colors.primary}>Xem bài viết</AppText>
              </Pressable>
            )}
          </View>
        )}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <Pressable
          disabled={page === 1 || loading}
          onPress={() => setPage(page - 1)}
        >
          <AppText color={page === 1 ? colors.textMuted : colors.primary}>
            Trang trước
          </AppText>
        </Pressable>
        <AppText>{page}</AppText>
        <Pressable
          disabled={items.length < 20 || loading}
          onPress={() => setPage(page + 1)}
        >
          <AppText
            color={items.length < 20 ? colors.textMuted : colors.primary}
          >
            Trang sau
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
