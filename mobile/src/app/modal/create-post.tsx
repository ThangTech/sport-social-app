import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
       onPress: () => void,
       onClose: () => void
}
export default function CreatePostScreen({onPress, onClose}: Props) {
  const [content, setContent] = useState("");

  const handleCreatePost = () => {
    if (!content.trim()) {
      Alert.alert("Thông báo", "Bạn chưa nhập nội dung bài viết.");
      return;
    }

    console.log("Post content:", content);

    Alert.alert("Thành công", "Đã đăng bài viết.");

    onClose();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={onPress}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Tạo bài viết</AppText>

        <Pressable
          style={[
            styles.postButton,
            !content.trim() && styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={!content.trim()}
        >
          <AppText style={styles.postButtonText}>Đăng</AppText>
        </Pressable>
      </View>

      <View style={styles.userSection}>
        <Image
          source={{
            uri: "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />

        <View>
          <AppText variant="subtitle">Nguyen Van Thang</AppText>

          <View style={styles.visibility}>
            <Ionicons name="earth-outline" size={14} color={COLORS.textMuted} />

            <AppText style={styles.visibilityText}>Công khai</AppText>
          </View>
        </View>
      </View>

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Bạn đang nghĩ gì về thể thao?"
        placeholderTextColor={COLORS.textMuted}
        multiline
        autoFocus
        style={styles.input}
      />

      <View style={styles.actions}>
        <AppText variant="subtitle">Thêm vào bài viết</AppText>

        <View style={styles.actionIcons}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="image-outline" size={26} color="#22c55e" />
          </Pressable>

          <Pressable style={styles.iconButton}>
            <Ionicons name="pricetag-outline" size={26} color="#3b82f6" />
          </Pressable>

          <Pressable style={styles.iconButton}>
            <Ionicons name="location-outline" size={26} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 64,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },

  postButtonDisabled: {
    opacity: 0.4,
  },

  postButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  visibility: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  visibilityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  input: {
    minHeight: 180,
    paddingHorizontal: SPACING.lg,
    fontSize: 18,
    color: COLORS.text,
    textAlignVertical: "top",
  },

  actions: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
