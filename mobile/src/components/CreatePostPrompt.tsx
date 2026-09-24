import Avatar from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost } from "@/contexts/CreatePostContext";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function CreatePostPrompt() {
  const { user } = useAuth();

  const { openCreatePost } = useCreatePost();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => openCreatePost()}>
        <Avatar
          source={
            user?.avatarUrl
              ? {
                  uri: getFileUrl(user.avatarUrl)!,
                }
              : require("../../assets/images/icon.png")
          }
        />
      </Pressable>

      <Pressable style={styles.input} onPress={openCreatePost}>
        <Text style={styles.placeholder}>Bạn đang nghĩ gì?</Text>
      </Pressable>

      <Pressable style={styles.imageButton} onPress={openCreatePost}>
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
  },

  placeholder: {
    color: COLORS.textMuted,
  },

  imageButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },
});
