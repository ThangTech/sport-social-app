import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { StyleSheet, View } from "react-native";
import AppText from "./ui/AppText";

type SportBadgeProps = {
  name: string;
};

export default function SportBadge({ name }: SportBadgeProps) {
  return (
    <View style={styles.badge}>
      <AppText variant="caption" color={COLORS.textBadge}>
        {name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
});