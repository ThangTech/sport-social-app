import { useTheme } from "@/contexts/ThemeContext";
import { FONT_SIZE } from "@/constants/theme";
import { StyleSheet, Text, TextProps } from "react-native";

type AppTextVariant = "title" | "subtitle" | "body" | "label" | "caption";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
};

export default function AppText({
  variant = "body",
  color,
  style,
  ...props
}: AppTextProps) {
  const { colors: COLORS } = useTheme();
  const styles = createStyles(COLORS);
  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        { color: color ?? COLORS.text },
        style,
      ]}
    />
  );
}

const createStyles = (COLORS: typeof import("@/constants/theme").COLORS) =>
  StyleSheet.create({
    base: {
      fontFamily: "Inter_400Regular",
    },

    title: {
      fontFamily: "Inter_700Bold",
      fontSize: FONT_SIZE.title,
      lineHeight: 32,
    },

    subtitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: FONT_SIZE.subtitle,
      lineHeight: 28,
    },

    body: {
      fontFamily: "Inter_400Regular",
      fontSize: FONT_SIZE.body,
      lineHeight: 24,
    },

    label: {
      fontFamily: "Inter_500Medium",
      fontSize: FONT_SIZE.small,
      lineHeight: 20,
    },

    caption: {
      fontFamily: "Inter_400Regular",
      fontSize: FONT_SIZE.caption,
      lineHeight: 16,
    },
  });
