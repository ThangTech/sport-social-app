import { COLORS } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import CreatePostScreen from "../modal/create-post";

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
            tabBarItemStyle: {
              transform: [{ translateX: -10 }],
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Khám phá",
            tabBarItemStyle: {
              transform: [{ translateX: -18 }],
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="community"
          options={{
            title: "Cộng đồng",
            tabBarItemStyle: {
              transform: [{ translateX: 18 }],
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Cá nhân",
            tabBarItemStyle: {
              transform: [{ translateX: 10 }],
            },
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
            <CreatePostScreen onPress={() => setShowCreate(false)} onClose={() => setShowCreate(false)}/>
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

    bottom: "1%",
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

    justifyContent: "center",
  },

  modalContent: {
    height: "75%",

    backgroundColor: COLORS.background,

    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,

    padding: 10,
  },
});
