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
import { useActionSheet } from "@expo/react-native-action-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { getFileUrl } from "@/services/api";
export default function EditPostScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { user } = useAuth();

  const { showActionSheetWithOptions } = useActionSheet();

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

  const visibilityLabel =
    visibility === 1
      ? "Công khai"
      : visibility === 2
        ? "Người theo dõi"
        : "Chỉ mình tôi";

  const visibilityIcon:
    | "earth-outline"
    | "people-outline"
    | "lock-closed-outline" =
    visibility === 1
      ? "earth-outline"
      : visibility === 2
        ? "people-outline"
        : "lock-closed-outline";

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

  const handleVisibility = () => {
    showActionSheetWithOptions(
      {
        options: ["Công khai", "Người theo dõi", "Chỉ mình tôi", "Hủy"],
        cancelButtonIndex: 3,
        title: "Ai có thể xem bài viết này?",
      },
      (index) => {
        if (index === 0) {
          setVisibility(1);
        }

        if (index === 1) {
          setVisibility(2);
        }

        if (index === 2) {
          setVisibility(3);
        }
      },
    );
  };

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
      router.replace({
        pathname: "/post/[id]",
        params: {
          id,
        },
      });
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
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>

          <AppText variant="subtitle">Chỉnh sửa bài viết</AppText>

          <View style={styles.headerSpace} />
        </View>

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
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Cần quyền truy cập",
        "Bạn cần cho phép ứng dụng truy cập thư viện ảnh.",
      );

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.9,
    });

    if (result.canceled) return;

    setSelectedImage(result.assets[0]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          disabled={submitting}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={27} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Chỉnh sửa bài viết</AppText>

        <Pressable
          style={[
            styles.saveButton,
            (!content.trim() || submitting) && styles.saveButtonDisabled,
          ]}
          disabled={!content.trim() || submitting}
          onPress={handleUpdate}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <AppText style={styles.saveButtonText}>Lưu</AppText>
          )}
        </Pressable>
      </View>

      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={COLORS.textMuted} />
        </View>

        <View>
          <AppText variant="subtitle">
            {user?.displayName ?? "Người dùng"}
          </AppText>

          <Pressable
            style={styles.visibility}
            disabled={submitting}
            onPress={handleVisibility}
          >
            <Ionicons
              name={visibilityIcon}
              size={14}
              color={COLORS.textMuted}
            />

            <AppText style={styles.visibilityText}>{visibilityLabel}</AppText>

            <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </View>

      <TextInput
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
        maxLength={5000}
        editable={!submitting}
        placeholder="Nội dung bài viết..."
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
      />
      {selectedImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{
              uri: selectedImage.uri,
            }}
            style={styles.imagePreview}
            resizeMode="cover"
          />

          <Pressable
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={18} color={COLORS.white} />
          </Pressable>

          <View style={styles.newImageBadge}>
            <AppText variant="caption" color={COLORS.white}>
              Ảnh mới
            </AppText>
          </View>
        </View>
      ) : existingMedia && !removeExistingImage ? (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{
              uri: getFileUrl(existingMedia.url)!,
            }}
            style={styles.imagePreview}
            resizeMode="cover"
          />

          <Pressable
            style={styles.removeImageButton}
            onPress={() => setRemoveExistingImage(true)}
          >
            <Ionicons name="trash-outline" size={17} color={COLORS.white} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.mediaActions}>
        <Pressable
          style={styles.mediaButton}
          disabled={submitting}
          onPress={handlePickImage}
        >
          <Ionicons name="image-outline" size={20} color={COLORS.primary} />

          <AppText variant="caption" color={COLORS.primary}>
            {existingMedia ? "Thay ảnh" : "Thêm ảnh"}
          </AppText>
        </Pressable>

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

  headerSpace: {
    width: 40,
  },

  saveButton: {
    minWidth: 64,

    paddingHorizontal: 16,
    paddingVertical: 8,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 20,

    backgroundColor: COLORS.primary,
  },

  saveButtonDisabled: {
    opacity: 0.4,
  },

  saveButtonText: {
    color: COLORS.background,
    fontWeight: "600",
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

  userSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,

    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.md,
  },

  avatar: {
    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: COLORS.surfaceAlt,

    alignItems: "center",
    justifyContent: "center",
  },

  visibility: {
    alignSelf: "flex-start",

    marginTop: 6,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: COLORS.surfaceAlt,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  visibilityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  input: {
    minHeight: 220,

    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,

    fontSize: 18,
    lineHeight: 25,

    color: COLORS.text,

    textAlignVertical: "top",
  },
  imagePreviewContainer: {
    height: 140,

    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,

    borderRadius: 14,

    overflow: "hidden",

    backgroundColor: COLORS.surfaceAlt,
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  removeImageButton: {
    position: "absolute",

    top: 8,
    right: 8,

    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: "rgba(0,0,0,0.65)",

    alignItems: "center",
    justifyContent: "center",
  },

  newImageBadge: {
    position: "absolute",

    left: 8,
    bottom: 8,

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 8,

    backgroundColor: "rgba(0,0,0,0.65)",
  },

  mediaActions: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mediaButton: {
    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.xs,
  },
});
