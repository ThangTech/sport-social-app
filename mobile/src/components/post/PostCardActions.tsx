import { Alert, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";

type Props = {
  reactionCount: number;
  currentReaction: number | null;
  reactionLoading: boolean;
  saved: boolean;
  saveLoading: boolean;
  commentCount: number;
  onReaction: () => void;
  onReactionCountPress: () => void;
  onComment?: () => void;
  onSave: () => void;
};

export default function PostCardActions(props: Props) {
  return (
    <View style={styles.actions}>
      <View
        style={[
          styles.reactionGroup,
          props.reactionLoading && styles.disabled,
        ]}
      >
        <Pressable
          hitSlop={8}
          disabled={props.reactionLoading}
          onPress={props.onReaction}
        >
          <Ionicons
            name={props.currentReaction ? "heart" : "heart-outline"}
            size={23}
            color={props.currentReaction ? COLORS.danger : COLORS.textMuted}
          />
        </Pressable>

        <Pressable
          hitSlop={8}
          disabled={props.reactionLoading}
          onPress={props.onReactionCountPress}
        >
          <AppText
            variant="caption"
            color={props.currentReaction ? COLORS.danger : COLORS.textMuted}
          >
            {props.reactionCount}
          </AppText>
        </Pressable>
      </View>
      <Pressable style={styles.actionButton} onPress={props.onComment}>
        <Ionicons name="chatbubble-outline" size={22} color={COLORS.textMuted} />
        <AppText variant="caption" color={COLORS.textMuted}>
          {props.commentCount}
        </AppText>
      </Pressable>
      <Pressable
        style={styles.actionButton}
        onPress={() => Alert.alert("Chia sẻ")}
      >
        <Ionicons name="share-social-outline" size={22} color={COLORS.textMuted} />
      </Pressable>
      <Pressable
        style={[styles.saveButton, props.saveLoading && styles.disabled]}
        disabled={props.saveLoading}
        onPress={props.onSave}
      >
        <Ionicons
          name={props.saved ? "bookmark" : "bookmark-outline"}
          size={23}
          color={props.saved ? COLORS.primary : COLORS.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  reactionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  saveButton: {
    marginLeft: "auto",
  },
  disabled: {
    opacity: 0.6,
  },
});
