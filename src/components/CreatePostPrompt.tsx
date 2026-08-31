import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Avatar from "./Avatar";

export default function CreatePostPrompt() {
  return (
    <View style={styles.container}>
      <Avatar source={require("../../assets/images/icon.png")} />

      <Pressable style={styles.input}>
        <Text style={{color: COLORS.textMuted}}>Bạn đang nghĩ gì?</Text>
      </Pressable>

      <Pressable
        style={styles.imageButton}
        onPress={() => Alert.alert("Chọn ảnh")}
      >
        <Ionicons name="image-outline" size={24} color={COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    color: COLORS.textMuted,
  },

  imageButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
