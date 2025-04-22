// app/(tabs)/home.tsx
"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { queryService, isApiError, getFriendlyErrorMessage } from "../../services/api"
import type { Appointment } from "../../types/appointment"
import type { User } from "../../types/user"
import WeeklyCalendar from "../../components/WeeklyCalendar"
import { Stack } from "expo-router"

export default function HomeScreen() {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [markedDates, setMarkedDates] = useState<{ [key: string]: boolean }>({})
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Hàm định dạng ngày thành chuỗi MM/YYYY
  const formatMonthYear = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${year}`
  }

  // Hàm định dạng ngày thành chuỗi YYYY/MM/DD
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}/${month}/${day}`
  }

  // Hàm định dạng ngày thành chuỗi YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Hàm định dạng ngày thành chuỗi hiển thị đầy đủ
  const formatFullDate = (date: Date): string => {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
    const months = [
      "tháng 1",
      "tháng 2",
      "tháng 3",
      "tháng 4",
      "tháng 5",
      "tháng 6",
      "tháng 7",
      "tháng 8",
      "tháng 9",
      "tháng 10",
      "tháng 11",
      "tháng 12",
    ]

    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    return `${dayName}, ngày ${day} ${month} năm ${year}`
  }

  // Lấy thông tin bác sĩ từ AsyncStorage
  const fetchUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      // console.error("Error fetching user info:", error)
    }
  }

  // Lấy dữ liệu lịch theo tháng
  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Format date as MM/YYYY for the API
      const formattedDate = formatMonthYear(selectedDate)

      const response = await queryService.getMonthlyCount(formattedDate)

      // Xử lý dữ liệu để hiển thị trên lịch
      const marked: { [key: string]: boolean } = {}
      if (response && response.value && response.value.appointmentCounts) {
        // Duyệt qua dữ liệu từ API
        Object.entries(response.value.appointmentCounts).forEach(([date, count]) => {
          if (count > 0) {
            marked[date] = true
          }
        })
      }

      setMarkedDates(marked)
    } catch (error) {
      // console.error("Error fetching monthly data:", error)
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  // Lấy danh sách cuộc hẹn theo ngày
  const fetchDailyAppointments = async (date: Date) => {
    try {
      setLoading(true)
      setError(null)

      // Format date as YYYY/MM/DD for the API
      const formattedDate = formatDateForApi(date)
      const dateString = formatDateString(date)

      const response = await queryService.getDailyCount(formattedDate)

      if (response && response.isSuccess && response.value) {
        // Tìm dữ liệu cho ngày được chọn trong mảng value
        const dayData = response.value.find((item) => {
          // Chuyển đổi định dạng ngày từ API (có thể là MM/DD/YYYY) sang YYYY-MM-DD để so sánh
          const apiDate = new Date(item.date).toISOString().split("T")[0]
          return apiDate === dateString
        })

        if (dayData && dayData.appointments && dayData.appointments.length > 0) {
          // Chuyển đổi dữ liệu để phù hợp với giao diện
          const formattedAppointments = dayData.appointments.map((appointment) => {
            // Chuyển đổi startTime thành time để hiển thị
            const time = appointment.startTime ? appointment.startTime.substring(0, 5) : "00:00"

            return {
              ...appointment,
              time,
              treatmentType: appointment.serviceName || appointment.procedurePriceTypeName || "Treatment",
            }
          })

          setAppointments(formattedAppointments)
        } else {
          setAppointments([])
        }
      } else {
        setAppointments([])
      }
    } catch (error) {
      // console.error("Error fetching daily appointments:", error)
      setAppointments([])

      // Hiển thị thông báo lỗi thân thiện
      const errorMessage = getFriendlyErrorMessage(error)
      setError(errorMessage)

      // Nếu lỗi là Unauthorized, chuyển về màn hình đăng nhập
      if (isApiError(error) && error.status === 401) {
        AsyncStorage.removeItem("accessToken")
        router.replace("/(auth)")
      }
    } finally {
      setLoading(false)
    }
  }

  // Xử lý lỗi API
  const handleApiError = (error: any) => {
    const errorMessage = getFriendlyErrorMessage(error)
    setError(errorMessage)

    if (isApiError(error) && error.status === 401) {
      AsyncStorage.removeItem("accessToken")
      router.replace("/(auth)")
    }
  }

  // Làm mới dữ liệu
  const onRefresh = async () => {
    setRefreshing(true)
    setError(null)
    await Promise.all([fetchMonthlyData(), fetchDailyAppointments(selectedDate)])
    setRefreshing(false)
  }

  // Gọi API khi component mount
  useEffect(() => {
    fetchUserInfo()
    fetchMonthlyData()
    fetchDailyAppointments(selectedDate)
  }, [])

  // Xử lý khi chọn ngày trên lịch
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    fetchDailyAppointments(date)
  }

  // Xử lý khi nhấn vào một cuộc hẹn
  const handleAppointmentPress = (appointment: Appointment) => {
    router.push({
      pathname: "/(details)/appointment-details",
      params: { id: appointment.id },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Lịch làm việc",
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
      <StatusBar barStyle="dark-content" />

      <WeeklyCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} markedDates={markedDates} />

      <View style={styles.appointmentsContainer}>
        <Text style={styles.dateHeader}>{formatFullDate(selectedDate)}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchDailyAppointments(selectedDate)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.appointmentCard} onPress={() => handleAppointmentPress(item)}>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={styles.appointmentDetails}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.treatmentType}>{item.treatmentType}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === "Confirmed"
                        ? styles.confirmedStatus
                        : item.status === "Pending"
                          ? styles.pendingStatus
                          : styles.completedStatus,
                    ]}
                  >
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        ) : (
          <View style={styles.noAppointments}>
            <Text style={styles.noAppointmentsText}>No appointments for this day</Text>
          </View>
        )}
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#d9534f",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  appointmentsContainer: {
    flex: 1,
    padding: 15,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  timeContainer: {
    backgroundColor: "#4a6da7",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  timeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  appointmentDetails: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  treatmentType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  confirmedStatus: {
    backgroundColor: "#e6f7ee",
  },
  pendingStatus: {
    backgroundColor: "#fff8e6",
  },
  completedStatus: {
    backgroundColor: "#e6e6e6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  noAppointments: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noAppointmentsText: {
    fontSize: 16,
    color: "#666",
  },
})