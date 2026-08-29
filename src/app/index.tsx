import AppHeader from "@/components/AppHeader";
import PostCard from "@/components/PostCard";
import { COLORS } from "@/constants/theme";
import { StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_POSTS } from "../data/mock-data";
import CreatePostPrompt from "@/components/CreatePostPrompt";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={true}
        ListHeaderComponent={CreatePostPrompt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
