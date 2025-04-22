// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4a6da7",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Lịch",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: 2,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Ẩn tab index */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Điều này sẽ ẩn tab index khỏi thanh điều hướng
        }}
      />
    </Tabs>
  )
}