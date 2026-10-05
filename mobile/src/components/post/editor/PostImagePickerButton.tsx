import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet } from "react-native";

type Props = {
  value: ImagePicker.ImagePickerAsset | null;
  onChange: (media: ImagePicker.ImagePickerAsset) => void;
  disabled?: boolean;
  variant?: "icon" | "label";
  label?: string;
};

export default function PostImagePickerButton({
  value,
  onChange,
  disabled = false,
  variant = "icon",
  label = "Thêm ảnh/video",
}: Props) {
  const handlePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Cần quyền truy cập",
        "Bạn cần cho phép ứng dụng truy cập thư viện ảnh và video.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: false,
      quality: 0.9,
      videoMaxDuration: 90,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) {
        Alert.alert(
          "File quá lớn",
          "Ảnh hoặc video không được vượt quá 20 MB.",
        );
        return;
      }

      onChange(asset);
    }
  };

  if (variant === "label") {
    return (
      <Pressable
        style={styles.labelButton}
        disabled={disabled}
        onPress={handlePress}
      >
        <Ionicons
          name={value?.type === "video" ? "videocam-outline" : "images-outline"}
          size={20}
          color={COLORS.primary}
        />

        <AppText variant="caption" color={COLORS.primary}>
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.iconButton}
      disabled={disabled}
      onPress={handlePress}
    >
      <Ionicons
        name={
          value?.type === "video"
            ? "videocam"
            : value
              ? "images"
              : "images-outline"
        }
        size={26}
        color={COLORS.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.surfaceAlt,
  },
  labelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
});
