import AppHeader from "@/components/AppHeader";
import PostCard from "@/components/PostCard";
import { COLORS, SPACING } from "@/constants/theme";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_POSTS } from "../data/mock-data";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader/>
      <PostCard post={MOCK_POSTS[0]}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
});