import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ImagePickerAsset } from "expo-image-picker";
import { Image, Pressable, StyleSheet, View } from "react-native";

type ExistingMedia = {
  id: string;
  url: string;
};

type Props = {
  selectedImage: ImagePickerAsset | null;
  onRemoveSelected: () => void;
  existingMedia?: ExistingMedia | null;
  removeExistingImage?: boolean;
  onRemoveExisting?: () => void;
  disabled?: boolean;
  variant: "create" | "edit";
};

export default function PostImagePreview({
  selectedImage,
  onRemoveSelected,
  existingMedia = null,
  removeExistingImage = false,
  onRemoveExisting,
  disabled = false,
  variant,
}: Props) {
  if (!selectedImage && (!existingMedia || removeExistingImage)) return null;

  const isNewImage = Boolean(selectedImage);
  const uri = selectedImage?.uri ?? getFileUrl(existingMedia?.url) ?? undefined;

  return (
    <View
      style={[
        styles.container,
        variant === "create" ? styles.createContainer : styles.editContainer,
      ]}
    >
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />

      <Pressable
        style={[
          styles.removeButton,
          variant === "create"
            ? styles.createRemoveButton
            : styles.editRemoveButton,
        ]}
        disabled={disabled}
        onPress={isNewImage ? onRemoveSelected : onRemoveExisting}
      >
        <Ionicons
          name={isNewImage ? "close" : "trash-outline"}
          size={variant === "create" ? 20 : isNewImage ? 18 : 17}
          color={COLORS.white}
        />
      </Pressable>

      {variant === "edit" && isNewImage ? (
        <View style={styles.newImageBadge}>
          <AppText variant="caption" color={COLORS.white}>
            Ảnh mới
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    marginHorizontal: SPACING.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceAlt,
  },
  createContainer: {
    marginBottom: SPACING.md,
    borderRadius: 16,
  },
  editContainer: {
    marginTop: SPACING.sm,
    borderRadius: 14,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  createRemoveButton: {
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  editRemoveButton: {
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
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
});
