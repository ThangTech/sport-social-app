import PostEditorForm from "@/components/post/editor/PostEditorForm";
import PostEditorHeader from "@/components/post/editor/PostEditorHeader";
import PostImagePickerButton from "@/components/post/editor/PostImagePickerButton";
import PostImagePreview from "@/components/post/editor/PostImagePreview";
import PostSportSelector, {
  PostSportBadge,
} from "@/components/post/editor/PostSportSelector";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { createGroupPost, getGroupById } from "@/services/group.service";
import { uploadPostMedia } from "@/services/post.service";
import { getSports } from "@/services/sport.service";
import { GroupMemberStatus, type GroupDto } from "@/types/group";
import type { SportDto } from "@/types/sport";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ImagePickerAsset } from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateGroupPostScreen() {
  const { user, profileImageVersion } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [group, setGroup] = useState<GroupDto | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportDto | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(
    null,
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sportsError, setSportsError] = useState("");
  const submittingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!id) {
      setErrorMessage("Không tìm thấy nhóm.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSportsError("");

      const [groupResult, sportsResult] = await Promise.all([
        getGroupById(id),
        getSports().catch(() => null),
      ]);

      if (groupResult.currentUserMemberStatus !== GroupMemberStatus.Active) {
        setErrorMessage("Bạn phải là thành viên của nhóm để đăng bài.");
        return;
      }

      setGroup(groupResult);
      if (sportsResult) {
        setSports(sportsResult);
      } else {
        setSportsError("Không thể tải danh sách môn thể thao.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin nhóm.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    const value = content.trim();

    if (!id || !value || submittingRef.current) return;

    let postCreated = false;
    let pendingCopyrightReview = false;

    try {
      submittingRef.current = true;
      setSubmitting(true);

      const post = await createGroupPost(id, {
        content: value,
        sportId: selectedSport?.id ?? null,
      });

      postCreated = true;

      if (selectedImage) {
        const media = await uploadPostMedia(post.id, selectedImage);
        pendingCopyrightReview = media.isPendingCopyrightReview;
      }

      router.back();
      if (post.groupModerationStatus === 1) {
        Alert.alert(
          "Đã gửi bài để duyệt",
          pendingCopyrightReview
            ? "Bài viết đang chờ quản trị nhóm duyệt và media cũng đang được kiểm tra bản quyền."
            : "Chủ nhóm, quản trị viên hoặc kiểm duyệt viên sẽ xem bài trước khi bài được hiển thị.",
        );
      } else if (pendingCopyrightReview) {
        Alert.alert(
          "Đang kiểm tra bản quyền",
          "Bài viết tạm thời chưa hiển thị vì media trùng với nội dung đã đăng ký.",
        );
      }
    } catch (error) {
      if (postCreated) {
        Alert.alert(
          "Ảnh chưa được tải lên",
          "Bài viết đã được tạo nhưng ảnh tải lên không thành công. Bài sẽ không được tạo lại.",
        );
        router.back();
        return;
      }

      Alert.alert(
        "Không thể đăng bài",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang chuẩn bị trình soạn bài...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <PostEditorHeader
          title="Đăng bài trong nhóm"
          onClose={() => router.back()}
          closeIcon="arrow-back"
        />
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={46}
            color={COLORS.textMuted}
          />
          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage || "Không thể tải thông tin nhóm."}
          </AppText>
          {id ? (
            <Pressable style={styles.retryButton} onPress={loadData}>
              <AppText variant="label" color={COLORS.background}>
                Thử lại
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PostEditorHeader
        title="Đăng bài trong nhóm"
        onClose={() => router.back()}
        closeIcon="arrow-back"
        submitLabel="Đăng"
        onSubmit={handleSubmit}
        submitDisabled={!content.trim() || submitting}
        submitting={submitting}
        variant="create"
      />

      <PostEditorForm
        content={content}
        onContentChange={setContent}
        showAudienceSelector={false}
        displayName={user?.displayName}
        avatarUrl={user?.avatarUrl}
        avatarVersion={profileImageVersion}
        disabled={submitting}
        placeholder="Chia sẻ điều gì đó với nhóm..."
        variant="create"
      >
        <View style={styles.groupContext}>
          <Ionicons name="people-outline" size={15} color={COLORS.primary} />
          <AppText variant="caption" color={COLORS.primary} numberOfLines={1}>
            {group.name}
          </AppText>
        </View>
      </PostEditorForm>

      <PostImagePreview
        selectedImage={selectedImage}
        onRemoveSelected={() => setSelectedImage(null)}
        disabled={submitting}
        variant="create"
      />

      <View style={styles.actions}>
        <View style={styles.actionLabel}>
          <PostSportBadge
            sport={selectedSport}
            onClear={() => setSelectedSport(null)}
            disabled={submitting}
          />
          <AppText variant="subtitle">Thêm vào bài viết</AppText>
          <AppText variant="caption" color={COLORS.textMuted}>
            Ảnh và môn thể thao
          </AppText>
          {sportsError ? (
            <AppText variant="caption" color={COLORS.danger}>
              {sportsError}
            </AppText>
          ) : null}
        </View>

        <View style={styles.actionIcons}>
          <PostImagePickerButton
            value={selectedImage}
            onChange={setSelectedImage}
            disabled={submitting}
          />
          <PostSportSelector
            sports={sports}
            value={selectedSport}
            onChange={setSelectedSport}
            disabled={submitting}
            variant="icon"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  groupContext: {
    marginTop: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  actions: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  actionLabel: {
    flex: 1,
    gap: SPACING.xs,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
});
