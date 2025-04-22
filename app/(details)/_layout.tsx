// app/(details)/_layout.tsx
import { Stack } from "expo-router"

export default function DetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true, // Đảm bảo mũi tên quay lại được hiển thị
        headerStyle: {
          backgroundColor: "#4a6da7",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitleAlign: "center", // Căn giữa tiêu đề cho tất cả màn hình
      }}
    >
      <Stack.Screen name="appointment-details" options={{ title: "Chi tiết cuộc hẹn" }} />
    </Stack>
  )
}