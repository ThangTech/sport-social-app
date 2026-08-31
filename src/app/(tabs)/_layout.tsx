import { COLORS } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export default function TabsLayout() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,

          tabBarStyle: {
            height: 68,
            paddingTop: 8,
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Bảng tin",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Khám phá",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="community"
          options={{
            title: "Cộng đồng",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Cá nhân",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      <Pressable
        style={styles.createButton}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add" size={32} color={COLORS.background} />
      </Pressable>

      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowCreate(false)}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  createButton: {
    position: "absolute",

    bottom: 38,
    left: "50%",
    marginLeft: -28,

    width: 56,
    height: 56,
    borderRadius: 28,

    backgroundColor: COLORS.primary,

    borderWidth: 4,
    borderColor: COLORS.surface,

    alignItems: "center",
    justifyContent: "center",

    elevation: 6,
  },

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.5)",

    justifyContent: "flex-end",
  },

  modalContent: {
    height: "85%",

    backgroundColor: COLORS.background,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    padding: 20,
  },

  closeButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },
});
