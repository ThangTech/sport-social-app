import { COLORS } from "@/constants/theme";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet } from "react-native";

import AppText from "@/components/ui/AppText";

type Props = {
  value: number;
  onChange: (visibility: number) => void;
  disabled?: boolean;
};

const AUDIENCES = [
  { label: "Công khai", icon: "earth-outline" },
  { label: "Người theo dõi", icon: "people-outline" },
  { label: "Chỉ mình tôi", icon: "lock-closed-outline" },
] as const;

export default function PostAudienceSelector({
  value,
  onChange,
  disabled = false,
}: Props) {
  const { showActionSheetWithOptions } = useActionSheet();
  const audience = AUDIENCES[value - 1] ?? AUDIENCES[0];

  const handlePress = () => {
    showActionSheetWithOptions(
      {
        options: [...AUDIENCES.map((item) => item.label), "Hủy"],
        cancelButtonIndex: AUDIENCES.length,
        title: "Ai có thể xem bài viết này?",
      },
      (index) => {
        if (index !== undefined && index < AUDIENCES.length) {
          onChange(index + 1);
        }
      },
    );
  };

  return (
    <Pressable style={styles.container} onPress={handlePress} disabled={disabled}>
      <Ionicons name={audience.icon} size={14} color={COLORS.textMuted} />

      <AppText style={styles.label}>{audience.label}</AppText>

      <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
  label: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
