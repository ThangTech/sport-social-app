import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Alert, Pressable, StyleSheet } from "react-native";

type Props = {
  value: ImagePicker.ImagePickerAsset | null;
  onChange: (image: ImagePicker.ImagePickerAsset) => void;
  disabled?: boolean;
  variant?: "icon" | "label";
  label?: string;
};

export default function PostImagePickerButton({
  value,
  onChange,
  disabled = false,
  variant = "icon",
  label = "Thêm ảnh",
}: Props) {
  const handlePress = async () => {
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

    if (!result.canceled) {
      onChange(result.assets[0]);
    }
  };

  if (variant === "label") {
    return (
      <Pressable style={styles.labelButton} disabled={disabled} onPress={handlePress}>
        <Ionicons name="image-outline" size={20} color={COLORS.primary} />

        <AppText variant="caption" color={COLORS.primary}>
          {label}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.iconButton} disabled={disabled} onPress={handlePress}>
      <Ionicons
        name={value ? "image" : "image-outline"}
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
