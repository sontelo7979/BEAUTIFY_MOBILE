"use client"

import { useEffect, useState } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, router, Stack } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { queryService, commandService, isApiError, getFriendlyErrorMessage } from "../../services/api"
import type { Appointment } from "../../types/appointment"
import ErrorMessage from "../../components/ErrorMessage"
import { Ionicons } from "@expo/vector-icons"

export default function AppointmentDetailsScreen() {
  const params = useLocalSearchParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [doctorNote, setDoctorNote] = useState<string>("")
  const [submittingNote, setSubmittingNote] = useState(false)

  // Hàm chuyển đổi định dạng thời gian thành phút
  const formatDurationToMinutes = (duration: string): string => {
    // Kiểm tra nếu duration đã là số
    if (!isNaN(Number(duration))) {
      return `${duration} phút`
    }

    // Kiểm tra nếu duration có định dạng HH:MM:SS
    const timePattern = /^(\d{2}):(\d{2}):(\d{2})$/
    const match = duration.match(timePattern)

    if (match) {
      const hours = Number.parseInt(match[1], 10)
      const minutes = Number.parseInt(match[2], 10)

      // Nếu có giờ, thêm vào kết quả
      if (hours > 0) {
        return `${hours * 60 + minutes} phút`
      }

      // Nếu chỉ có phút
      return `${minutes} phút`
    }

    // Trả về nguyên bản nếu không khớp định dạng
    return `${duration} phút`
  }

  // Lấy chi tiết cuộc hẹn
  const fetchAppointmentDetails = async () => {
    if (!params.id) {
      setError("Appointment ID is missing")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await queryService.getAppointmentDetails(params.id as string)

      if (response && response.value && response.value.appointment) {
        // Chuyển đổi dữ liệu để phù hợp với giao diện
        const appt = response.value.appointment
        const formattedAppointment = {
          ...appt,
          time: appt.startTime ? appt.startTime.substring(0, 5) : appt.time || "00:00",
          treatmentType: appt.serviceName || appt.procedurePriceTypeName || appt.treatmentType || "Treatment",
        }

        setAppointment(formattedAppointment)
      } else {
        setError("Failed to load appointment details")
      }
    } catch (error) {
      console.error("Error fetching appointment details:", error)
      const errorMessage = getFriendlyErrorMessage(error)
      setError(errorMessage)

      if (isApiError(error) && error.status === 401) {
        AsyncStorage.removeItem("accessToken")
        router.replace("/(auth)")
      }
    } finally {
      setLoading(false)
    }
  }

  // Cập nhật trạng thái cuộc hẹn
  const updateAppointmentStatus = async (status: string) => {
    if (!appointment) return

    try {
      setUpdating(true)
      setError(null)

      await commandService.updateAppointmentStatus(appointment.id, status)

      // Cập nhật trạng thái trong state
      setAppointment({ ...appointment, status: status as any })
      Alert.alert("Success", "Appointment status updated successfully")
    } catch (error) {
      console.error("Error updating appointment status:", error)
      const errorMessage = getFriendlyErrorMessage(error)
      setError(errorMessage)

      if (isApiError(error) && error.status === 401) {
        AsyncStorage.removeItem("accessToken")
        router.replace("/(auth)")
      }
    } finally {
      setUpdating(false)
    }
  }

  // Hủy cuộc hẹn
  const cancelAppointment = async () => {
    if (!appointment) return

    try {
      setUpdating(true)
      setError(null)

      await commandService.cancelAppointment(appointment.id)

      // Cập nhật trạng thái trong state
      setAppointment({ ...appointment, status: "Cancelled" as any })
      Alert.alert("Success", "Appointment cancelled successfully")
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      const errorMessage = getFriendlyErrorMessage(error)
      setError(errorMessage)

      if (isApiError(error) && error.status === 401) {
        AsyncStorage.removeItem("accessToken")
        router.replace("/(auth)")
      }
    } finally {
      setUpdating(false)
    }
  }

  // Hàm xử lý khi bác sĩ muốn đánh giá
  const handleSubmitNote = () => {
    if (!appointment || !doctorNote.trim()) return

    // Kiểm tra nếu cuộc hẹn đã được đánh giá trước đó
    if (appointment.isNoted) {
      // Hiển thị hộp thoại xác nhận
      Alert.alert(
        "Đánh giá lại",
        "Cuộc hẹn này đã được đánh giá trước đó. Bạn có muốn đánh giá lại không?",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Đánh giá lại",
            onPress: () => submitDoctorNote(),
          },
        ],
        { cancelable: true },
      )
    } else {
      // Nếu chưa đánh giá, gọi hàm đánh giá trực tiếp
      submitDoctorNote()
    }
  }

  // Hàm gửi đánh giá lên server
  const submitDoctorNote = async () => {
    if (!appointment || !doctorNote.trim()) return

    try {
      setSubmittingNote(true)
      setError(null)

      await commandService.updateCustomerSchedule(appointment.customerScheduleId, doctorNote)

      // Cập nhật trạng thái đã đánh giá
      setAppointment({ ...appointment, isNoted: true })
      setDoctorNote("") // Clear the input
      Alert.alert("Success", "Đánh giá cuộc hẹn đã được lưu thành công")
    } catch (error) {
      console.error("Error submitting doctor note:", error)
      const errorMessage = getFriendlyErrorMessage(error)
      setError(errorMessage)

      if (isApiError(error) && error.status === 401) {
        AsyncStorage.removeItem("accessToken")
        router.replace("/(auth)")
      }
    } finally {
      setSubmittingNote(false)
    }
  }

  // Gọi API khi component mount
  useEffect(() => {
    fetchAppointmentDetails()
  }, [params.id])

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Chi tiết cuộc hẹn",
          headerShown: true,

          headerStyle: {
            backgroundColor: "#4a6da7",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
            <Text style={styles.loadingText}>Loading appointment details...</Text>
          </View>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchAppointmentDetails} />
        ) : appointment ? (
          <>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông tin khách hàng</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Tên:</Text>
                <Text style={styles.value}>{appointment.customerName}</Text>
              </View>

              {appointment.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Điện thoại:</Text>
                  <Text style={styles.value}>{appointment.phone}</Text>
                </View>
              )}

              {appointment.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{appointment.email}</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Chi tiết cuộc hẹn</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày:</Text>
                <Text style={styles.value}>
                  {appointment.date
                    ? new Date(appointment.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not specified"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Thời gian:</Text>
                <Text style={styles.value}>
                  {appointment.startTime ? appointment.startTime.substring(0, 5) : "Not specified"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Điều trị:</Text>
                <Text style={styles.value}>{appointment.treatmentType}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Thời lượng:</Text>
                <Text style={styles.value}>
                  {appointment.duration ? formatDurationToMinutes(appointment.duration) : "Không xác định"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Trạng thái:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    appointment.status === "Confirmed"
                      ? styles.confirmedStatus
                      : appointment.status === "Pending"
                        ? styles.pendingStatus
                        : appointment.status === "Cancelled"
                          ? styles.cancelledStatus
                          : styles.completedStatus,
                  ]}
                >
                  <Text style={styles.statusText}>{appointment.status}</Text>
                </View>
              </View>
            </View>

            {/* Doctor Evaluation Section */}
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Đánh giá của bác sĩ</Text>
              </View>

              {/* Hiển thị trạng thái đã đánh giá nếu isNoted = true */}
              {appointment.isNoted && (
                <View style={styles.notedStatusContainer}>
                  <Text style={styles.notedStatusText}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" /> Cuộc hẹn này đã được đánh giá
                  </Text>
                </View>
              )}

              {/* Luôn hiển thị form nhập đánh giá */}
              <View style={styles.evaluationContainer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder={
                    appointment.isNoted ? "Nhập đánh giá mới..." : "Nhập đánh giá của bạn về cuộc hẹn này..."
                  }
                  multiline={true}
                  numberOfLines={4}
                  value={doctorNote}
                  onChangeText={setDoctorNote}
                />
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    (!doctorNote.trim() || submittingNote) && styles.disabledButton,
                  ]}
                  onPress={handleSubmitNote}
                  disabled={!doctorNote.trim() || submittingNote}
                >
                  {submittingNote ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{appointment.isNoted ? "Đánh giá lại" : "Lưu đánh giá"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Không tìm thấy cuộc hẹn</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#4a6da7",
    padding: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    width: 100,
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  notes: {
    padding: 15,
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
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
  cancelledStatus: {
    backgroundColor: "#ffebee",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  buttonContainer: {
    margin: 15,
    marginBottom: 30,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "center",
    height: 50,
  },
  confirmButton: {
    backgroundColor: "#4a6da7",
  },
  completeButton: {
    backgroundColor: "#28a745",
  },
  rescheduleButton: {
    backgroundColor: "#f0ad4e",
  },
  cancelButton: {
    backgroundColor: "#d9534f",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  evaluationContainer: {
    padding: 15,
  },
  savedNoteContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 15,
  },
  notedStatusContainer: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notedStatusText: {
    fontSize: 14,
    color: "#28a745",
    textAlign: "center",
  },
})
