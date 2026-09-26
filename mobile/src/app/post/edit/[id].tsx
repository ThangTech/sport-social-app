import AppText from "@/components/ui/AppText";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, SPACING } from "@/constants/theme";
import {
  getPostById,
  updatePost,
  deletePostMedia,
  updatePostMedia,
  uploadPostMedia,
} from "@/services/post.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { getSports } from "@/services/sport.service";
import type { SportDto } from "@/types/sport";
import PostSportSelector from "@/components/post/editor/PostSportSelector";
import PostImagePickerButton from "@/components/post/editor/PostImagePickerButton";
import PostImagePreview from "@/components/post/editor/PostImagePreview";
import PostEditorHeader from "@/components/post/editor/PostEditorHeader";
import PostEditorForm from "@/components/post/editor/PostEditorForm";
export default function EditPostScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(1);

  const [sportId, setSportId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [existingMedia, setExistingMedia] = useState<{
    id: string;
    url: string;
  } | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [sports, setSports] = useState<SportDto[]>([]);

  const [sportName, setSportName] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setErrorMessage("Không tìm thấy bài viết.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        const post = await getPostById(id);

        if (user?.id !== post.authorId) {
          setErrorMessage("Bạn không có quyền chỉnh sửa bài viết này.");
          return;
        }

        setContent(post.content ?? "");
        setVisibility(post.visibility);
        setSportId(post.sportId ?? null);
        setSportName(post.sportName ?? null);
        const image = post.media.find((media) => media.mediaType === 1);

        if (image) {
          setExistingMedia({
            id: image.id,
            url: image.url,
          });
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải bài viết.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, user?.id]);
  useEffect(() => {
    const loadSports = async () => {
      try {
        setSports(await getSports());
      } catch (error) {
        console.log("Không thể tải môn thể thao:", error);
      }
    };

    loadSports();
  }, []);
  const handleUpdate = async () => {
    const value = content.trim();

    if (!id || !value || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      await updatePost(id, {
        content: value,
        sportId,
        visibility,
      });
      if (selectedImage) {
        if (existingMedia && !removeExistingImage) {
          await updatePostMedia(id, existingMedia.id, selectedImage);
        } else {
          if (existingMedia && removeExistingImage) {
            await deletePostMedia(id, existingMedia.id);
          }

          await uploadPostMedia(id, selectedImage);
        }
      } else if (existingMedia && removeExistingImage) {
        await deletePostMedia(id, existingMedia.id);
      }
      router.back();
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật bài viết",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải bài viết...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <PostEditorHeader
          title="Chỉnh sửa bài viết"
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
            {errorMessage}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <PostEditorHeader
        title="Chỉnh sửa bài viết"
        onClose={() => router.back()}
        submitLabel="Lưu"
        onSubmit={handleUpdate}
        submitDisabled={!content.trim() || submitting}
        submitting={submitting}
      />

      <PostEditorForm
        content={content}
        onContentChange={setContent}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        displayName={user?.displayName}
        disabled={submitting}
        placeholder="Nội dung bài viết..."
        variant="edit"
      >
          <PostSportSelector
            sports={sports}
            value={
              sportId && sportName ? { id: sportId, name: sportName } : null
            }
            onChange={(sport) => {
              setSportId(sport?.id ?? null);
              setSportName(sport?.name ?? null);
            }}
            disabled={submitting}
          />
      </PostEditorForm>
      <PostImagePreview
        selectedImage={selectedImage}
        onRemoveSelected={() => setSelectedImage(null)}
        existingMedia={existingMedia}
        removeExistingImage={removeExistingImage}
        onRemoveExisting={() => setRemoveExistingImage(true)}
        variant="edit"
      />
      <View style={styles.mediaActions}>
        <PostImagePickerButton
          value={selectedImage}
          onChange={setSelectedImage}
          disabled={submitting}
          variant="label"
          label={existingMedia ? "Thay ảnh" : "Thêm ảnh"}
        />

        {removeExistingImage ? (
          <Pressable onPress={() => setRemoveExistingImage(false)}>
            <AppText variant="caption" color={COLORS.textMuted}>
              Hoàn tác xóa ảnh
            </AppText>
          </Pressable>
        ) : null}
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

    alignItems: "center",
    justifyContent: "center",

    padding: SPACING.xl,
  },

  message: {
    marginTop: SPACING.md,
    textAlign: "center",
  },

  mediaActions: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

});
