import { COLORS, FONT_SIZE } from "@/constants/theme";
import { StyleSheet, Text, TextProps } from "react-native";

type AppTextVariant =
  | "title"
  | "subtitle"
  | "body"
  | "label"
  | "caption";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
};

export default function AppText({
  variant = "body",
  color = COLORS.text,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], { color }, style]}
    />
  );
}

const styles = StyleSheet.create({
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