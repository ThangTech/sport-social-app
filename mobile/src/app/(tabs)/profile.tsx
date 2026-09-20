import AppText from "@/components/ui/AppText";
import { COLORS } from "@/constants/theme";
import { StyleSheet, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={signOut} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
      <AppText variant="title">Trang cá nhân</AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
