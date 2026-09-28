import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  approveGroupJoinRequest,
  getGroupJoinRequests,
  rejectGroupJoinRequest,
} from "@/services/group.service";
import type { GroupMemberDto } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RequestAction = "approve" | "reject";

export default function GroupJoinRequestsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [requests, setRequests] = useState<GroupMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] =
    useState<RequestAction | null>(null);
  const processingUserIdRef = useRef<string | null>(null);

  const loadRequests = useCallback(
    async (showLoading = true) => {
      if (!id) {
        setErrorMessage("Không tìm thấy nhóm.");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        setErrorMessage("");

        const result = await getGroupJoinRequests(id);
        setRequests(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải yêu cầu tham gia.",
        );
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const processRequest = async (
    request: GroupMemberDto,
    action: RequestAction,
  ) => {
    if (!id || processingUserIdRef.current) return;

    try {
      processingUserIdRef.current = request.userId;
      setProcessingUserId(request.userId);
      setProcessingAction(action);

      if (action === "approve") {
        await approveGroupJoinRequest(id, request.userId);
      } else {
        await rejectGroupJoinRequest(id, request.userId);
      }

      setRequests((current) =>
        current.filter((item) => item.userId !== request.userId),
      );
    } catch (error) {
      Alert.alert(
        action === "approve"
          ? "Không thể duyệt yêu cầu"
          : "Không thể từ chối yêu cầu",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      await loadRequests(false);
      processingUserIdRef.current = null;
      setProcessingUserId(null);
      setProcessingAction(null);
    }
  };

  const confirmReject = (request: GroupMemberDto) => {
    if (processingUserIdRef.current) return;

    Alert.alert(
      "Từ chối yêu cầu",
      `Bạn có chắc muốn từ chối yêu cầu của ${request.displayName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: () => processRequest(request, "reject"),
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

        <AppText variant="subtitle">Yêu cầu tham gia</AppText>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải yêu cầu...
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
          <Pressable style={styles.retryButton} onPress={() => loadRequests()}>
            <AppText variant="label" color={COLORS.background}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={
            requests.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="person-add-outline"
                size={50}
                color={COLORS.textMuted}
              />
              <AppText color={COLORS.textMuted} style={styles.message}>
                Không có yêu cầu tham gia nào.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const isProcessing = processingUserId === item.userId;
            const actionsDisabled = processingUserId !== null;

            return (
              <View style={styles.requestItem}>
                <Image
                  source={
                    item.avatarUrl
                      ? { uri: getFileUrl(item.avatarUrl)! }
                      : require("@/assets/images/icon.png")
                  }
                  style={styles.avatar}
                />

                <View style={styles.userInfo}>
                  <AppText variant="label">{item.displayName}</AppText>
                  <AppText variant="caption" color={COLORS.textMuted}>
                    @{item.userName}
                  </AppText>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    disabled={actionsDisabled}
                    onPress={() => processRequest(item, "approve")}
                    style={[
                      styles.approveButton,
                      actionsDisabled && styles.disabledButton,
                    ]}
                  >
                    {isProcessing && processingAction === "approve" ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.background}
                      />
                    ) : (
                      <AppText variant="label" color={COLORS.background}>
                        Duyệt
                      </AppText>
                    )}
                  </Pressable>

                  <Pressable
                    disabled={actionsDisabled}
                    onPress={() => confirmReject(item)}
                    style={[
                      styles.rejectButton,
                      actionsDisabled && styles.disabledButton,
                    ]}
                  >
                    {isProcessing && processingAction === "reject" ? (
                      <ActivityIndicator size="small" color={COLORS.danger} />
                    ) : (
                      <AppText variant="label" color={COLORS.danger}>
                        Từ chối
                      </AppText>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
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
  requestItem: {
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  userInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  actions: {
    gap: SPACING.sm,
  },
  approveButton: {
    minWidth: 82,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  rejectButton: {
    minWidth: 82,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  disabledButton: {
    opacity: 0.55,
  },
  center: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyList: {
    flexGrow: 1,
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
});
