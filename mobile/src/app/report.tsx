import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { createReport } from "@/services/report.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const reasons = [{ key: "spam", label: "Spam" }, { key: "harassment", label: "Quấy rối" }, { key: "hate", label: "Thù ghét" }, { key: "violence", label: "Bạo lực" }, { key: "sexual", label: "Nội dung tình dục" }, { key: "impersonation", label: "Mạo danh" }, { key: "other", label: "Lý do khác" }];

export default function ReportScreen() {
  const params = useLocalSearchParams<{ targetType?: string; targetId?: string }>();
  const targetType = Number(params.targetType);
  const targetId = params.targetId;
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!targetId || ![1, 2, 3, 4].includes(targetType) || !reason) return;
    if (reason === "other" && !description.trim()) { Alert.alert("Thiếu mô tả", "Vui lòng mô tả lý do báo cáo."); return; }
    try {
      setSubmitting(true);
      await createReport(targetType, targetId, reason, description);
      Alert.alert("Đã gửi báo cáo", "Báo cáo sẽ được System Admin xem xét.", [{ text: "Đóng", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Không thể gửi báo cáo", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally { setSubmitting(false); }
  };

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Pressable style={styles.headerButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></Pressable><AppText variant="subtitle">Báo cáo</AppText><View style={styles.headerButton} /></View>
    <View style={styles.content}>
      <AppText color={COLORS.textMuted}>Chọn lý do phù hợp nhất. Báo cáo trùng hoặc gửi quá mức sẽ bị từ chối.</AppText>
      <View style={styles.reasons}>{reasons.map((item) => <Pressable key={item.key} style={[styles.reason, reason === item.key && styles.selected]} onPress={() => setReason(item.key)}><AppText color={reason === item.key ? COLORS.background : COLORS.text}>{item.label}</AppText></Pressable>)}</View>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline maxLength={3000} placeholder="Mô tả thêm (không bắt buộc)" placeholderTextColor={COLORS.textMuted} />
      <Pressable disabled={!reason || submitting} style={[styles.submit, (!reason || submitting) && styles.disabled]} onPress={submit}>{submitting ? <ActivityIndicator color={COLORS.background} /> : <AppText variant="label" color={COLORS.background}>Gửi báo cáo</AppText>}</Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background }, header: { height: 64, paddingHorizontal: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, content: { padding: SPACING.lg, gap: SPACING.lg }, reasons: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm }, reason: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full }, selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, input: { minHeight: 120, padding: SPACING.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, textAlignVertical: "top" }, submit: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.full, backgroundColor: COLORS.primary }, disabled: { opacity: 0.5 } });
