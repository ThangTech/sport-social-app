import { COLORS } from "@/constants/theme";
import { StyleSheet, View, Image, ImageSourcePropType } from "react-native";


type AvatarProps = {
  source: ImageSourcePropType;
};
export default function Avatar({ source }: AvatarProps) {
  return (
    <View style={styles.avatar}>
      <Image
      source={source}
      style={styles.image}
      resizeMode = "cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
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