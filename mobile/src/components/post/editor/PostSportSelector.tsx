import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import type { SportDto } from "@/types/sport";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  sports: SportDto[];
  value: Pick<SportDto, "id" | "name"> | null;
  onChange: (sport: SportDto | null) => void;
  disabled?: boolean;
  variant?: "field" | "icon";
};

export default function PostSportSelector({
  sports,
  value,
  onChange,
  disabled = false,
  variant = "field",
}: Props) {
  const { showActionSheetWithOptions } = useActionSheet();

  const handlePress = () => {
    const options = [
      "Không chọn môn thể thao",
      ...sports.map((sport) => sport.name),
      "Hủy",
    ];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: "Chọn môn thể thao",
      },
      (index) => {
        if (index === undefined || index === cancelButtonIndex) return;
        onChange(index === 0 ? null : sports[index - 1]);
      },
    );
  };

  if (variant === "icon") {
    return (
      <Pressable
        style={styles.iconButton}
        disabled={disabled || sports.length === 0}
        onPress={handlePress}
      >
        <Ionicons
          name={value ? "football" : "football-outline"}
          size={26}
          color="#3b82f6"
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.field}
      disabled={disabled || sports.length === 0}
      onPress={handlePress}
    >
      <Ionicons
        name="football-outline"
        size={16}
        color={value ? COLORS.primary : COLORS.textMuted}
      />

      <AppText
        variant="caption"
        color={value ? COLORS.primary : COLORS.textMuted}
      >
        {value?.name ?? "Chọn môn thể thao"}
      </AppText>

      <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
    </Pressable>
  );
}

type BadgeProps = {
  sport: SportDto | null;
  onClear: () => void;
  disabled?: boolean;
};

export function PostSportBadge({
  sport,
  onClear,
  disabled = false,
}: BadgeProps) {
  if (!sport) return null;

  return (
    <View style={styles.badge}>
      <Ionicons name="football-outline" size={16} color={COLORS.primary} />

      <AppText variant="caption" color={COLORS.primary}>
        {sport.name}
      </AppText>

      <Pressable hitSlop={10} disabled={disabled} onPress={onClear}>
        <Ionicons name="close" size={17} color={COLORS.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: COLORS.surfaceAlt,
  },
  badge: {
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
