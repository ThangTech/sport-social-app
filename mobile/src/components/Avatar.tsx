import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, View, Image, ImageSourcePropType } from "react-native";

type AvatarProps = {
  source: ImageSourcePropType;
};
export default function Avatar({ source }: AvatarProps) {
  const { colors: COLORS } = useTheme();
  const styles = createStyles(COLORS);
  return (
    <View style={styles.avatar}>
      <Image source={source} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const createStyles = (COLORS: typeof import("@/constants/theme").COLORS) =>
  StyleSheet.create({
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
    },

    image: {
      width: "100%",
      height: "100%",
    },
  });
