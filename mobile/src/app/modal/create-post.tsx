import AppText from "@/components/ui/AppText";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { createPost, uploadPostMedia } from "@/services/post.service";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { getSports } from "@/services/sport.service";
import type { SportDto } from "@/types/sport";
type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreatePostScreen({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  const { showActionSheetWithOptions } = useActionSheet();

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sports, setSports] = useState<SportDto[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportDto | null>(null);
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

    if (result.canceled) {
      return;
    }

    setSelectedImage(result.assets[0]);
  };
  const handleSelectSport = () => {
    const sportNames = sports.map((sport) => sport.name);

    const options = ["Không chọn môn thể thao", ...sportNames, "Hủy"];

    const cancelIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: cancelIndex,
        title: "Chọn môn thể thao",
      },
      (index) => {
        if (index === undefined || index === cancelIndex) {
          return;
        }

        if (index === 0) {
          setSelectedSport(null);
          return;
        }

        setSelectedSport(sports[index - 1]);
      },
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={onClose}
          disabled={submitting}
        >
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Tạo bài viết</AppText>

        <Pressable
          style={[
            styles.postButton,
            (!content.trim() || submitting) && styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!content.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <AppText style={styles.postButtonText}>Đăng</AppText>
          )}
        </Pressable>
      </View>

      <View style={styles.userSection}>
        <Image
          source={
            user?.avatarUrl
              ? {
                  uri: getFileUrl(user.avatarUrl)!,
                }
              : require("@/assets/images/icon.png")
          }
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <AppText variant="subtitle">
            {user?.displayName || "Người dùng"}
          </AppText>

          <Pressable
            style={styles.visibility}
            onPress={handleVisibility}
            disabled={submitting}
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
        placeholder="Bạn đang nghĩ gì về thể thao?"
        placeholderTextColor={COLORS.textMuted}
        multiline
        autoFocus
        maxLength={5000}
        editable={!submitting}
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
            disabled={submitting}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={20} color={COLORS.white} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.actions}>
        <View>
          {selectedSport ? (
            <View style={styles.selectedSport}>
              <Ionicons
                name="football-outline"
                size={16}
                color={COLORS.primary}
              />

              <AppText variant="caption" color={COLORS.primary}>
                {selectedSport.name}
              </AppText>

              <Pressable
                hitSlop={10}
                disabled={submitting}
                onPress={() => setSelectedSport(null)}
              >
                <Ionicons name="close" size={17} color={COLORS.textMuted} />
              </Pressable>
            </View>
          ) : null}
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
          <Pressable
            style={styles.iconButton}
            disabled={submitting}
            onPress={handlePickImage}
          >
            <Ionicons
              name={selectedImage ? "image" : "image-outline"}
              size={26}
              color={COLORS.primary}
            />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            disabled={submitting || sports.length === 0}
            onPress={handleSelectSport}
          >
            <Ionicons
              name={selectedSport ? "football" : "football-outline"}
              size={26}
              color="#3b82f6"
            />
          </Pressable>
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

  postButton: {
    minWidth: 68,

    paddingHorizontal: 16,
    paddingVertical: 8,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },

  postButtonDisabled: {
    opacity: 0.4,
  },

  postButtonText: {
    color: COLORS.background,
    fontWeight: "600",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",

    gap: SPACING.md,

    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  userInfo: {
    flex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,

    backgroundColor: COLORS.surfaceAlt,
  },

  visibility: {
    alignSelf: "flex-start",

    marginTop: 6,

    paddingHorizontal: 9,
    paddingVertical: 5,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    borderRadius: 8,

    backgroundColor: COLORS.surfaceAlt,
  },

  visibilityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  input: {
    minHeight: 180,

    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,

    fontSize: 18,
    lineHeight: 25,

    color: COLORS.text,

    textAlignVertical: "top",
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

  iconButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 21,
    backgroundColor: COLORS.surfaceAlt,
  },
  imagePreviewContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,

    height: 140,

    borderRadius: 16,

    overflow: "hidden",

    backgroundColor: COLORS.surfaceAlt,
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  removeImageButton: {
    position: "absolute",

    top: 10,
    right: 10,

    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "rgba(0,0,0,0.65)",

    alignItems: "center",
    justifyContent: "center",
  },
  selectedSport: {
    alignSelf: "flex-start",

    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,

    paddingHorizontal: 10,
    paddingVertical: 6,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,

    borderRadius: 16,

    backgroundColor: COLORS.primarySoft,
  },
});
