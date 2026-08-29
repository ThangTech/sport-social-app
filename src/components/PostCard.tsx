import { COLORS, SPACING } from "@/constants/theme";
import { Image, StyleSheet, View } from "react-native";
import AppText from "./ui/AppText";
import Avatar from "./Avatar";
import SportBadge from "./SportBadge";

export default function PostCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          source={require("../../assets/images/icon.png")}
        />

        <View style={styles.author}>
          <AppText variant="label">
            Nguyễn Văn Thắng
          </AppText>

          <AppText variant="caption" color={COLORS.textMuted}>
            30 phút trước
          </AppText>
        </View>

        <SportBadge name="Bóng đá" />
      </View>

      <View style={styles.content}>
        <AppText>
          Một buổi tập tuyệt vời cùng đồng đội! ⚽
        </AppText>
      </View>
      <View style={styles.imageContainer}>
              <Image
              source={require("../../assets/images/football.jpg")}
              style={styles.postImage}
              resizeMode="cover"
              />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  header: {
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  author: {
    flex: 1,
  },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  imageContainer: {
  width: "100%",
  height: 280,
  backgroundColor: COLORS.surfaceAlt,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
},
  postImage: {
    width: "100%",
    height: "100%"
  },
});