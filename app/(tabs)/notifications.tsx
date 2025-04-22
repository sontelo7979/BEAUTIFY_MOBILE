// app/(tabs)/notifications.tsx
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Stack } from "expo-router"

// Định nghĩa interface cho thông báo
interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

// Dữ liệu thông báo mẫu
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Cuộc hẹn mới",
    message: "Bạn có một cuộc hẹn mới với Emma Johnson vào lúc 09:00 ngày mai",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: "2",
    title: "Nhắc nhở",
    message: "Cuộc hẹn với Michael Chen sẽ diễn ra trong 1 giờ nữa",
    time: "5 giờ trước",
    read: false,
  },
  {
    id: "3",
    title: "Cập nhật lịch",
    message: "Cuộc hẹn với Sophia Rodriguez đã được xác nhận",
    time: "1 ngày trước",
    read: true,
  },
  {
    id: "4",
    title: "Hủy cuộc hẹn",
    message: "James Wilson đã hủy cuộc hẹn vào ngày 07/04/2025",
    time: "2 ngày trước",
    read: true,
  },
  {
    id: "5",
    title: "Nhắc nhở",
    message: "Vui lòng cập nhật thông tin cá nhân của bạn",
    time: "1 tuần trước",
    read: true,
  },
]

export default function NotificationsScreen() {
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Thông báo",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#4a6da7",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />

      <FlatList
        data={sampleNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a6da7",
  },
  notificationsList: {
    padding: 15,
  },
  notificationItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: "#f0f7ff",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4a6da7",
    alignSelf: "flex-start",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
})