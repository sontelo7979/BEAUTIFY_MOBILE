// app/(tabs)/home.tsx
"use client";

import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  queryService,
  isApiError,
  getFriendlyErrorMessage,
} from "../../services/api";
import type { Appointment } from "../../types/appointment";
import type { User } from "../../types/user";
import WeeklyCalendar from "../../components/WeeklyCalendar";
import { Stack } from "expo-router";

// Hàm fetch với cơ chế retry
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 3
) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[API] Attempt ${i + 1} for ${url}`);
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.log(`[API] Attempt ${i + 1} failed:`, error);
      lastError = error;
      // Đợi trước khi thử lại (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    }
  }

  throw lastError;
};

// Hàm xử lý response API
const handleApiResponse = async (response: Response) => {
  try {
    // Kiểm tra response có ok không
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Lấy text trước
    const text = await response.text();

    // Nếu response rỗng, trả về cấu trúc mặc định
    if (!text || text.trim() === "") {
      console.log("[API] Empty response received, returning default structure");
      return {
        isSuccess: false,
        value: null,
        error: "Empty response from server",
      };
    }

    // Thử phân tích JSON
    return JSON.parse(text);
  } catch (error) {
    console.error("[API] Error handling response:", error);
    throw error;
  }
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Hàm định dạng ngày thành chuỗi MM/YYYY
  const formatMonthYear = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  // Hàm định dạng ngày thành chuỗi YYYY/MM/DD
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  // Hàm định dạng ngày thành chuỗi YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Hàm định dạng ngày thành chuỗi hiển thị đầy đủ
  const formatFullDate = (date: Date): string => {
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
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
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ngày ${day} ${month} năm ${year}`;
  };

  // Kiểm tra kết nối mạng
  const checkNetworkStatus = async () => {
    try {
      console.log("[checkNetworkStatus] Checking network status");
      // Sử dụng Promise.race thay vì AbortSignal.timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Network check timeout")), 5000)
      );
      const fetchPromise = fetch("https://www.google.com", { method: "HEAD" });

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;
      console.log(
        "[checkNetworkStatus] Network check response status:",
        response.status
      );
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error("[checkNetworkStatus] Network check failed:", error);
      setIsConnected(false);
      setError(
        "Network connectivity issue detected. Please check your connection."
      );
      return false;
    }
  };

  // Lấy thông tin bác sĩ từ AsyncStorage
  const fetchUserInfo = async () => {
    try {
      console.log("[fetchUserInfo] Starting to fetch user data");
      const userData = await AsyncStorage.getItem("userData");
      console.log("[fetchUserInfo] User data from AsyncStorage:", userData);

      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log("[fetchUserInfo] Parsed user data:", parsedUserData);
          setUser(parsedUserData);
        } catch (parseError) {
          console.error("[fetchUserInfo] Error parsing user data:", parseError);
        }
      } else {
        console.log("[fetchUserInfo] No user data found in AsyncStorage");
      }
    } catch (error) {
      console.error("[fetchUserInfo] Error fetching user info:", error);
    }
  };

  // Lấy dữ liệu lịch theo tháng
  const fetchMonthlyData = async () => {
    try {
      console.log("[fetchMonthlyData] Starting to fetch monthly data");
      setLoading(true);
      setError(null);

      // Kiểm tra kết nối mạng trước khi gọi API
      const isNetworkAvailable = await checkNetworkStatus();
      if (!isNetworkAvailable) {
        console.log("[fetchMonthlyData] Network not available, aborting");
        setLoading(false);
        return;
      }

      // Format date as MM/YYYY for the API
      const formattedDate = formatMonthYear(selectedDate);
      console.log("[fetchMonthlyData] Formatted date for API:", formattedDate);

      console.log("[fetchMonthlyData] Calling API getMonthlyCount");

      // Lấy token xác thực
      const token = await AsyncStorage.getItem("accessToken");
      console.log(`[fetchMonthlyData] Auth token available: ${!!token}`);

      try {
        const response = await queryService.getMonthlyCount(formattedDate);
        console.log(
          "[fetchMonthlyData] API response:",
          JSON.stringify(response, null, 2)
        );

        // Xử lý dữ liệu để hiển thị trên lịch
        const marked: { [key: string]: boolean } = {};
        if (response && response.value && response.value.appointmentCounts) {
          console.log("[fetchMonthlyData] Processing appointment counts");
          // Duyệt qua dữ liệu từ API
          Object.entries(response.value.appointmentCounts).forEach(
            ([date, count]) => {
              console.log(`[fetchMonthlyData] Date: ${date}, Count: ${count}`);
              if (count > 0) {
                marked[date] = true;
              }
            }
          );
        } else {
          console.log(
            "[fetchMonthlyData] No appointment counts data in response"
          );
        }

        // console.log("[fetchMonthlyData] Setting marked dates:", marked);
        setMarkedDates(marked);
      } catch (apiError) {
        // console.error("[fetchMonthlyData] API error:", apiError);
        handleApiError(apiError);
      }
    } catch (error) {
      console.error("[fetchMonthlyData] Error fetching monthly data:", error);
      if (error instanceof Error) {
        // console.error("[fetchMonthlyData] Error message:", error.message);
        // console.error("[fetchMonthlyData] Error stack:", error.stack);
      }
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách cuộc hẹn theo ngày
  const fetchDailyAppointments = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra kết nối mạng trước khi gọi API
      const isNetworkAvailable = await checkNetworkStatus();
      if (!isNetworkAvailable) {
        // console.log("[fetchDailyAppointments] Network not available, aborting");
        setLoading(false);
        return;
      }

      // Format date as YYYY/MM/DD for the API
      const formattedDate = formatDateForApi(date);
      const dateString = formatDateString(date);
      // console.log(
      //   "[fetchDailyAppointments] Formatted date for API:",
      //   formattedDate
      // );
      // console.log(
      //   "[fetchDailyAppointments] Date string for comparison:",
      //   dateString
      // );

      // console.log("[fetchDailyAppointments] Calling API getDailyCount");

      try {
        const response = await queryService.getDailyCount(formattedDate);
        // console.log(
        //   "[fetchDailyAppointments] API response:",
        //   JSON.stringify(response, null, 2)
        // );

        if (response && response.isSuccess && response.value) {
          // console.log(
          //   "[fetchDailyAppointments] Response is successful with value"
          // );

          // Tìm dữ liệu cho ngày được chọn trong mảng value
          const dayData = response.value.find((item) => {
            // Chuyển đổi định dạng ngày từ API (có thể là MM/DD/YYYY) sang YYYY-MM-DD để so sánh
            const apiDate = new Date(item.date).toISOString().split("T")[0];
            // console.log(
            //   `[fetchDailyAppointments] Comparing API date: ${apiDate} with selected date: ${dateString}`
            // );
            return apiDate === dateString;
          });

          // console.log("[fetchDailyAppointments] Found day data:", dayData);

          if (
            dayData &&
            dayData.appointments &&
            dayData.appointments.length > 0
          ) {
            // console.log(
            //   `[fetchDailyAppointments] Found ${dayData.appointments.length} appointments`
            // );
            // Chuyển đổi dữ liệu để phù hợp với giao diện
            const formattedAppointments = dayData.appointments.map(
              (appointment) => {
                // Chuyển đổi startTime thành time để hiển thị
                const time = appointment.startTime
                  ? appointment.startTime.substring(0, 5)
                  : "00:00";

                const formattedAppointment = {
                  ...appointment,
                  time,
                  treatmentType:
                    appointment.serviceName ||
                    appointment.procedurePriceTypeName ||
                    "Treatment",
                };

                // console.log(
                //   "[fetchDailyAppointments] Formatted appointment:",
                //   formattedAppointment
                // );
                return formattedAppointment;
              }
            );

            setAppointments(formattedAppointments);
          } else {
            // console.log(
            //   "[fetchDailyAppointments] No appointments found for this day"
            // );
            setAppointments([]);
          }
        } else {
          // console.log(
          //   "[fetchDailyAppointments] Invalid response format or unsuccessful response"
          // );
          setAppointments([]);
        }
      } catch (apiError) {
        // console.error("[fetchDailyAppointments] API error:", apiError);
        setAppointments([]);
        handleApiError(apiError);
      }
    } catch (error) {
      // console.error(
      //   "[fetchDailyAppointments] Error fetching daily appointments:",
      //   error
      // );
      if (error instanceof Error) {
        // console.error("[fetchDailyAppointments] Error message:", error.message);
        // console.error("[fetchDailyAppointments] Error stack:", error.stack);
      }

      setAppointments([]);

      // Hiển thị thông báo lỗi thân thiện
      const errorMessage = getFriendlyErrorMessage(error);
      // console.error(
      //   "[fetchDailyAppointments] Friendly error message:",
      //   errorMessage
      // );
      setError(errorMessage);

      // Nếu lỗi là Unauthorized, chuyển về màn hình đăng nhập
      if (isApiError(error) && error.status === 401) {
        // console.log(
        //   "[fetchDailyAppointments] Unauthorized error, redirecting to auth screen"
        // );
        AsyncStorage.removeItem("accessToken");
        router.replace("/(auth)");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lỗi API
  const handleApiError = (error: any) => {
    // console.log("[handleApiError] Handling API error");
    const errorMessage = getFriendlyErrorMessage(error);
    // console.log("[handleApiError] Friendly error message:", errorMessage);
    setError(errorMessage);

    if (isApiError(error)) {
      // console.log("[handleApiError] API error status:", error.status);
      if (error.status === 401) {
        // console.log(
        //   "[handleApiError] Unauthorized error, redirecting to auth screen"
        // );
        AsyncStorage.removeItem("accessToken");
        router.replace("/(auth)");
      }
    }
  };

  // Làm mới dữ liệu
  const onRefresh = async () => {
    // console.log("[onRefresh] Starting refresh");
    setRefreshing(true);
    setError(null);

    try {
      // Kiểm tra kết nối mạng trước khi làm mới dữ liệu
      const isNetworkAvailable = await checkNetworkStatus();
      if (isNetworkAvailable) {
        console.log("[onRefresh] Network available, fetching data");
        await Promise.all([
          fetchMonthlyData(),
          fetchDailyAppointments(selectedDate),
        ]);
        console.log("[onRefresh] Refresh completed successfully");
      } else {
        console.log("[onRefresh] Network not available, cannot refresh");
      }
    } catch (error) {
      // console.error("[onRefresh] Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Xử lý khi ứng dụng thay đổi trạng thái (background/foreground)
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // console.log(`[AppState] App state changed to: ${nextAppState}`);
    if (nextAppState === "active") {
      // console.log(
      //   "[AppState] App came to foreground, checking network and refreshing data"
      // );
      checkNetworkStatus().then((isAvailable) => {
        if (isAvailable) {
          fetchMonthlyData();
          fetchDailyAppointments(selectedDate);
        }
      });
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    console.log("[useEffect] Component mounted, fetching initial data");

    // Lắng nghe sự kiện thay đổi trạng thái ứng dụng
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    fetchUserInfo();
    checkNetworkStatus().then((isAvailable) => {
      if (isAvailable) {
        fetchMonthlyData();
        fetchDailyAppointments(selectedDate);
      }
    });

    return () => {
      // console.log("[useEffect] Component unmounting");
      subscription.remove();
    };
  }, []);

  // Xử lý khi chọn ngày trên lịch
  const handleDateSelect = (date: Date) => {
    // console.log("[handleDateSelect] Date selected:", date);
    setSelectedDate(date);
    fetchDailyAppointments(date);
  };

  // Xử lý khi nhấn vào một cuộc hẹn
  const handleAppointmentPress = (appointment: Appointment) => {
    // console.log(
    //   "[handleAppointmentPress] Appointment pressed:",
    //   appointment.id
    // );
    router.push({
      pathname: "/(details)/appointment-details",
      params: { id: appointment.id },
    });
  };

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

      {!isConnected && (
        <View style={styles.networkBanner}>
          <Text style={styles.networkBannerText}>
            Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.
          </Text>
        </View>
      )}

      <WeeklyCalendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        markedDates={markedDates}
      />

      <View style={styles.appointmentsContainer}>
        <Text style={styles.dateHeader}>{formatFullDate(selectedDate)}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a6da7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                console.log("[RetryButton] Retry button pressed");
                checkNetworkStatus().then((isAvailable) => {
                  if (isAvailable) {
                    fetchDailyAppointments(selectedDate);
                  }
                });
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.appointmentCard}
                onPress={() => handleAppointmentPress(item)}
              >
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.noAppointments}>
            <Text style={styles.noAppointmentsText}>
              No appointments for this day
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  networkBanner: {
    backgroundColor: "#f8d7da",
    padding: 10,
    alignItems: "center",
  },
  networkBannerText: {
    color: "#721c24",
    fontSize: 14,
    fontWeight: "500",
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
});
