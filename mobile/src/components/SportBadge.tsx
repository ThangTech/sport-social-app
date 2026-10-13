import { useTheme } from "@/contexts/ThemeContext";
import { RADIUS, SPACING } from "@/constants/theme";
import { StyleSheet, View } from "react-native";
import AppText from "./ui/AppText";

type SportBadgeProps = {
  name: string;
};

export default function SportBadge({ name }: SportBadgeProps) {
  const { colors: COLORS } = useTheme();
  const styles = createStyles(COLORS);
  return (
    <View style={styles.badge}>
      <AppText variant="caption" color={COLORS.textBadge}>
        {name}
      </AppText>
    </View>
  );
}

const createStyles = (COLORS: typeof import("@/constants/theme").COLORS) =>
  StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
    },
  });
