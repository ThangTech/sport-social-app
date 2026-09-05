import AppText from "@/components/ui/AppText";
import { COLORS } from "@/constants/theme";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppText variant="title">Cộng đồng</AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
});