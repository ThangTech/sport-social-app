import AppText from "@/components/ui/AppText";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, SPACING } from "@/constants/theme";
import { createPost, uploadPostMedia } from "@/services/post.service";
import { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { getSports } from "@/services/sport.service";
import type { SportDto } from "@/types/sport";
import PostSportSelector, {
  PostSportBadge,
} from "@/components/post/editor/PostSportSelector";
import PostImagePickerButton from "@/components/post/editor/PostImagePickerButton";
import PostImagePreview from "@/components/post/editor/PostImagePreview";
import PostEditorHeader from "@/components/post/editor/PostEditorHeader";
import PostEditorForm from "@/components/post/editor/PostEditorForm";
type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreatePostScreen({ onClose, onCreated }: Props) {
  const { user, profileImageVersion } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportDto | null>(null);
  useEffect(() => {
    const loadSports = async () => {
      try {
        const result = await getSports();
        setSports(result);
      } catch (error) {
        console.log("Không thể tải môn thể thao:", error);
      }
    };

    loadSports();
  }, []);
  const handleCreatePost = async () => {
    const value = content.trim();

    if (!value || submitting) return;

    let postCreated = false;

    try {
      setSubmitting(true);

      const post = await createPost({
        content: value,
        sportId: selectedSport?.id ?? null,
        visibility,
      });

      postCreated = true;

      if (selectedImage) {
        await uploadPostMedia(post.id, selectedImage);
      }

      setContent("");
      setSelectedImage(null);
      setSelectedSport(null);

      onClose();
      onCreated?.();
    } catch (error) {
      if (postCreated) {
        Alert.alert(
          "Ảnh chưa được tải lên",
          "Bài viết đã được tạo nhưng ảnh tải lên không thành công. Bạn có thể thử lại sau.",
        );

        onClose();
        onCreated?.();

        return;
      }

      Alert.alert(
        "Không thể đăng bài",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <PostEditorHeader
        title="Tạo bài viết"
        onClose={onClose}
        submitLabel="Đăng"
        onSubmit={handleCreatePost}
        submitDisabled={!content.trim() || submitting}
        submitting={submitting}
        variant="create"
      />

      <PostEditorForm
        content={content}
        onContentChange={setContent}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        displayName={user?.displayName}
        avatarUrl={user?.avatarUrl}
        avatarVersion={profileImageVersion}
        disabled={submitting}
        placeholder="Bạn đang nghĩ gì về thể thao?"
        variant="create"
      />
      <PostImagePreview
        selectedImage={selectedImage}
        onRemoveSelected={() => setSelectedImage(null)}
        disabled={submitting}
        variant="create"
      />
      <View style={styles.actions}>
        <View>
          <PostSportBadge
            sport={selectedSport}
            onClear={() => setSelectedSport(null)}
            disabled={submitting}
          />
          <AppText variant="subtitle">Thêm vào bài viết</AppText>

          <AppText
            variant="caption"
            color={COLORS.textMuted}
            style={styles.actionsDescription}
          >
            Ảnh và môn thể thao
          </AppText>
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

  actions: {
    margin: SPACING.lg,
    padding: SPACING.lg,

    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: COLORS.surface,
  },

  actionsDescription: {
    marginTop: 4,
  },

  actionIcons: {
    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.xs,
  },

});
