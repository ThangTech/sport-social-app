import AppHeader from "@/components/AppHeader";
import SportBadge from "@/components/SportBadge";
import { COLORS, SPACING } from "@/constants/theme";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader/>
      <View style={styles.content}>
        <SportBadge name="Bóng đá" />
      </View>
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