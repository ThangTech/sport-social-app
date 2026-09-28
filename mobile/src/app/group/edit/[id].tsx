import AvatarCoverImageEditor from "@/components/image/AvatarCoverImageEditor";
import GroupForm from "@/components/group/GroupForm";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteGroupAvatar,
  deleteGroupCover,
  getGroupById,
  updateGroup,
  updateGroupAvatar,
  updateGroupCover,
} from "@/services/group.service";
import { ApiError } from "@/types/api";
import type { GroupDto, SaveGroupRequest } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditGroupScreen() {
  const { user: currentUser } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadGroup = useCallback(async (showLoading = true) => {
    if (!id) {
      setErrorMessage("Không tìm thấy nhóm.");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
        setErrorMessage("");
      }

      const result = await getGroupById(id);

      if (result.ownerId !== currentUser?.id) {
        setGroup(null);
        setErrorMessage("Chỉ chủ nhóm mới có thể chỉnh sửa nhóm này.");
        return;
      }

      setGroup(result);
    } catch (error) {
      if (!showLoading) throw error;

      setGroup(null);
      setErrorMessage(
        error instanceof ApiError && error.status === 404
          ? "Không tìm thấy nhóm."
          : error instanceof Error
            ? error.message
            : "Không thể tải thông tin nhóm.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentUser?.id, id]);

  useFocusEffect(
    useCallback(() => {
      void loadGroup();
    }, [loadGroup]),
  );

  const handleSubmit = async (request: SaveGroupRequest) => {
    if (!id) return;

    await updateGroup(id, request);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Chỉnh sửa nhóm</AppText>
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
              onPress={() => void loadGroup()}
            >
              <AppText variant="label" color={COLORS.background}>
                Thử lại
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : group ? (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <AvatarCoverImageEditor
              title="Ảnh nhóm"
              avatarUrl={group.avatarUrl}
              coverUrl={group.coverUrl}
              imageVersion={group.updatedAt ?? group.createdAt}
              disabled={false}
              onBusyChange={setImageSubmitting}
              onUpdated={(result) =>
                setGroup((current) =>
                  current
                    ? {
                        ...current,
                        avatarUrl: result.avatarUrl,
                        coverUrl: result.coverUrl,
                        updatedAt: result.updatedAt,
                      }
                    : current,
                )
              }
              onReload={() => loadGroup(false)}
              uploadAvatar={(asset) => updateGroupAvatar(group.id, asset)}
              uploadCover={(asset) => updateGroupCover(group.id, asset)}
              deleteAvatar={() => deleteGroupAvatar(group.id)}
              deleteCover={() => deleteGroupCover(group.id)}
            />

            <GroupForm
              initialName={group.name}
              initialDescription={group.description}
              initialPrivacy={group.privacy}
              submitLabel="Lưu thay đổi"
              disabled={imageSubmitting}
              onSubmit={handleSubmit}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
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
});
