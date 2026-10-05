import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import {
  appealCopyrightCase,
  appealExternalCopyrightScan,
  getMyCopyrightCases,
  getMyExternalCopyrightScans,
} from "@/services/copyright.service";
import type {
  CopyrightCase,
  ExternalCopyrightScan,
} from "@/types/copyright";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const caseStatuses: Record<number, string> = {
  1: "Đang chờ Admin kiểm tra",
  2: "Đã xác nhận vi phạm",
  3: "Hồ sơ đã được bác bỏ",
  4: "Đang xem xét kháng nghị",
  5: "Kháng nghị được chấp nhận",
  6: "Kháng nghị bị từ chối",
};

const scanStatuses: Record<number, string> = {
  1: "Đang quét âm thanh video",
  2: "Không phát hiện kết quả khớp",
  3: "Đang chờ Admin kiểm tra",
  4: "Admin đã cho phép nội dung",
  5: "Admin xác nhận vi phạm",
  6: "Không thể quét tự động",
  7: "Đang xem xét kháng nghị",
  8: "Kháng nghị được chấp nhận",
  9: "Kháng nghị bị từ chối",
};

type AppealTarget = {
  id: string;
  kind: "case" | "scan";
};

export default function CopyrightScreen() {
  const [cases, setCases] = useState<CopyrightCase[]>([]);
  const [scans, setScans] = useState<ExternalCopyrightScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [appealTarget, setAppealTarget] = useState<AppealTarget | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [caseItems, scanItems] = await Promise.all([
        getMyCopyrightCases(),
        getMyExternalCopyrightScans(),
      ]);
      setCases(caseItems);
      setScans(scanItems);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể tải trạng thái bản quyền.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAppeal = async () => {
    if (!appealTarget || appealReason.trim().length < 10) {
      return;
    }

    setSubmitting(true);
    try {
      if (appealTarget.kind === "case") {
        await appealCopyrightCase(
          appealTarget.id,
          appealReason.trim(),
        );
      } else {
        await appealExternalCopyrightScan(
          appealTarget.id,
          appealReason.trim(),
        );
      }

      setAppealTarget(null);
      setAppealReason("");
      await load();
      Alert.alert("Đã gửi", "Kháng nghị của bạn đang chờ System Admin xử lý.");
    } catch (reason) {
      Alert.alert(
        "Không thể gửi kháng nghị",
        reason instanceof Error ? reason.message : "Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <AppText variant="subtitle">Bản quyền của tôi</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {error ? (
            <View style={styles.errorCard}>
              <AppText color={COLORS.danger}>{error}</AppText>
              <Pressable onPress={() => void load()}>
                <AppText variant="label" color={COLORS.primary}>
                  Thử lại
                </AppText>
              </Pressable>
            </View>
          ) : null}

          <SectionTitle title="Đối chiếu reference" count={cases.length} />
          {cases.length === 0 ? (
            <EmptyCard text="Bạn chưa có hồ sơ đối chiếu bản quyền." />
          ) : (
            cases.map((item) => (
              <View style={styles.card} key={item.id}>
                <AppText variant="label">{item.assetTitle}</AppText>
                <AppText variant="caption" color={COLORS.textMuted}>
                  Chủ sở hữu: {item.rightsOwnerName}
                </AppText>
                <StatusText status={item.status} text={caseStatuses[item.status]} />
                {item.decisionNotes ? (
                  <AppText variant="caption">Kết luận: {item.decisionNotes}</AppText>
                ) : null}
                {item.appealReason ? (
                  <AppText variant="caption">
                    Kháng nghị: {item.appealReason}
                  </AppText>
                ) : null}
                {item.canAppeal ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setAppealTarget({
                        id: item.id,
                        kind: "case",
                      });
                    }}
                  >
                    <AppText variant="label" color={COLORS.primary}>
                      Gửi kháng nghị
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}

          <SectionTitle title="Quét AI ảnh và video" count={scans.length} />
          {scans.length === 0 ? (
            <EmptyCard text="Chưa có nội dung nào được gửi đi quét." />
          ) : (
            scans.map((item) => (
              <View style={styles.card} key={item.id}>
                <AppText variant="label">{item.provider}</AppText>
                <StatusText status={item.status} text={scanStatuses[item.status]} />
                {item.matchSummary ? (
                  <AppText variant="caption">{item.matchSummary}</AppText>
                ) : null}
                {item.errorMessage ? (
                  <AppText variant="caption" color={COLORS.danger}>
                    {item.errorMessage}
                  </AppText>
                ) : null}
                {item.reviewNotes ? (
                  <AppText variant="caption">Kết luận: {item.reviewNotes}</AppText>
                ) : null}
                {item.appealReason ? (
                  <AppText variant="caption">
                    Kháng nghị: {item.appealReason}
                  </AppText>
                ) : null}
                {item.canAppeal ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      setAppealTarget({
                        id: item.id,
                        kind: "scan",
                      });
                    }}
                  >
                    <AppText variant="label" color={COLORS.primary}>
                      Gửi kháng nghị
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal transparent visible={appealTarget !== null} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="subtitle">Kháng nghị quyết định</AppText>
            <AppText variant="caption" color={COLORS.textMuted}>
              Nêu căn cứ và bằng chứng rõ ràng. Mỗi hồ sơ chỉ được kháng nghị một
              lần trong thời hạn cho phép.
            </AppText>
            <TextInput
              style={styles.input}
              value={appealReason}
              onChangeText={setAppealReason}
              multiline
              placeholder="Lý do kháng nghị (tối thiểu 10 ký tự)"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                disabled={submitting}
                onPress={() => {
                  setAppealTarget(null);
                  setAppealReason("");
                }}
              >
                <AppText variant="label">Hủy</AppText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryButton]}
                disabled={submitting || appealReason.trim().length < 10}
                onPress={() => void submitAppeal()}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <AppText variant="label" color={COLORS.background}>
                    Gửi kháng nghị
                  </AppText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="caption" color={COLORS.textMuted}>
        {count} mục
      </AppText>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="shield-checkmark-outline" size={36} color={COLORS.textMuted} />
      <AppText color={COLORS.textMuted}>{text}</AppText>
    </View>
  );
}

function StatusText({ status, text }: { status: number; text?: string }) {
  const color = status === 2 || status === 4 || status === 5
    ? COLORS.primaryDark
    : status === 3 || status === 6
      ? COLORS.danger
      : COLORS.primary;
  return (
    <AppText variant="caption" color={color}>
      {text ?? "Trạng thái không xác định"}
    </AppText>
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
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  sectionTitle: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  card: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  emptyCard: {
    minHeight: 140,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  errorCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  modalBackdrop: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
  },
  input: {
    minHeight: 130,
    padding: SPACING.md,
    color: COLORS.text,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.sm,
  },
  modalButton: {
    minWidth: 110,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
});
