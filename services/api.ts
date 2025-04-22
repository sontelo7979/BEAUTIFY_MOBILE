// services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage"
import { parseJwt, extractUserFromJwt } from "../utils/jwt-helper"
import type { User } from "../types/user"
import type {
  ApiResponse,
  LoginResponse,
  MonthlyCountResponse,
  DailyCountResponse,
  AppointmentDetailsResponse,
  ApiError,
  UserInformationResponse,
  ChangePasswordResponse,
} from "../types/api-responses"

// Định nghĩa base URLs cho các loại API khác nhau
const BASE_DOMAIN = "http://160.187.240.214" // Thay thế bằng domain thực tế của bạn
const API_URLS = {
  QUERY: `${BASE_DOMAIN}:3000`,
  COMMAND: `${BASE_DOMAIN}:4000`,
  AUTH: `${BASE_DOMAIN}:5000`,
}

// Hàm helper để xử lý lỗi
const handleFetchError = (error: any): never => {
  // console.error("API Error:", error)
  throw error
}

// Hàm helper để thêm token vào header
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("accessToken")
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Hàm helper để gọi API
const apiRequest = async <T>(
  baseUrl: string, 
  endpoint: string,
  method: string = 'GET',
  data?: any, 
  params?: Record<string, string>
)
: Promise<T> =>
{
  try {
    // Xây dựng URL với query params
    let url = `${baseUrl}${endpoint}`
    if (params) {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value)
      })
      url += `?${queryParams.toString()}`
    }

    // console.log(`API Request: ${method} ${url}`)

    // Chuẩn bị options cho fetch
    const options: RequestInit = {
      method,
      headers: await getAuthHeaders(),
    }

    // Thêm body nếu có data và không phải GET request
    if (data && method !== "GET") {
      options.body = JSON.stringify(data)
    }

    // Gọi API
    const response = await fetch(url, options)

    // Parse JSON response
    const responseData = await response.json()

    // Kiểm tra nếu response có cấu trúc lỗi API
    if (!response.ok) {
      // Xử lý lỗi 401 (Unauthorized)
      if (response.status === 401) {
        await AsyncStorage.removeItem("accessToken")
        throw {
          status: 401,
          detail: "Unauthorized",
          message: "Your session has expired. Please log in again.",
        } as ApiError
      }

      // Xử lý các lỗi khác
      throw {
        status: response.status,
        ...responseData,
        message: responseData.detail || responseData.message || "API request failed",
      } as ApiError
    }

    // Kiểm tra nếu response có cấu trúc API Response nhưng isFailure = true
    if ("isSuccess" in responseData && !responseData.isSuccess) {
      throw {
        status: 400,
        detail: responseData.error?.message || "Request failed",
        message: responseData.error?.message || "Request failed",
      } as ApiError
    }

    return responseData as T;
  } catch (error) {
    // console.error("API Error:", error)
    return Promise.reject(error);
  }
}

// Service cho xác thực
export const authService = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await apiRequest<LoginResponse>(API_URLS.AUTH, "/api/v1/auth/login", "POST", { email, password })

      if (!response.isSuccess || !response.value.accessToken) {
        throw {
          status: 400,
          detail: response.error?.message || "Login failed",
          message: response.error?.message || "Login failed",
        } as ApiError
      }

      // Lưu access token
      await AsyncStorage.setItem("accessToken", response.value.accessToken)
      await AsyncStorage.setItem("refreshToken", response.value.refreshToken)

      // Giải mã JWT để lấy thông tin người dùng
      const payload = parseJwt(response.value.accessToken)
      if (!payload) {
        throw {
          status: 400,
          detail: "Invalid token format",
          message: "Invalid token format",
        } as ApiError
      }

      // Chuyển đổi payload thành đối tượng User
      const user = extractUserFromJwt(payload)

      return { token: response.value.accessToken, user }
    } catch (error) {
      return Promise.reject(error)
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem("accessToken")
    await AsyncStorage.removeItem("refreshToken")
    await AsyncStorage.removeItem("userData")
  },
  // Thêm API đổi mật khẩu
  changePassword: async (newPassword: string): Promise<ChangePasswordResponse> => {
    try {
      return await apiRequest<ChangePasswordResponse>(API_URLS.AUTH, "/api/v1/auth/change_password", "POST", {
        newPassword,
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },
}

// Service cho các truy vấn (queries)
export const queryService = {
  // Lấy số lượng cuộc hẹn theo tháng
  getMonthlyCount: async (date: string): Promise<MonthlyCountResponse> => {
    try {
      return await apiRequest<MonthlyCountResponse>(
        API_URLS.QUERY,
        "/api/v1/working-schedules/doctors/monthly-count",
        "GET",
        undefined,
        { date },
      )
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Lấy danh sách cuộc hẹn theo ngày
  getDailyCount: async (date: string): Promise<DailyCountResponse> => {
    try {
      return await apiRequest<DailyCountResponse>(
        API_URLS.QUERY,
        "/api/v1/working-schedules/doctors/daily-count",
        "GET",
        undefined,
        { date },
      )
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Lấy chi tiết cuộc hẹn
  getAppointmentDetails: async (id: string): Promise<AppointmentDetailsResponse> => {
    try {
      return await apiRequest<AppointmentDetailsResponse>(
        API_URLS.QUERY,
        `/api/v1/working-schedules/doctors/${id}`,
        "GET",
      )
    } catch (error) {
      return Promise.reject(error)
    }
  },
  // Lấy thông tin người dùng
  getUserInformation: async (): Promise<UserInformationResponse> => {
    try {
      return await apiRequest<UserInformationResponse>(API_URLS.QUERY, "/api/v1/users/information", "GET")
    } catch (error) {
      return Promise.reject(error)
    }
  },
}

// Service cho các lệnh (commands)
export const commandService = {
  // Cập nhật trạng thái cuộc hẹn
  updateAppointmentStatus: async (id: string, status: string): Promise<ApiResponse> => {
    try {
      return await apiRequest<ApiResponse>(API_URLS.COMMAND, `/api/v1/appointments/${id}/status`, "PUT", { status })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Đặt lịch lại cuộc hẹn
  rescheduleAppointment: async (id: string, newDate: string, newTime: string): Promise<ApiResponse> => {
    try {
      return await apiRequest<ApiResponse>(API_URLS.COMMAND, `/api/v1/appointments/${id}/reschedule`, "PUT", {
        date: newDate,
        time: newTime,
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Hủy cuộc hẹn
  cancelAppointment: async (id: string, reason?: string): Promise<ApiResponse> => {
    try {
      return await apiRequest<ApiResponse>(API_URLS.COMMAND, `/api/v1/appointments/${id}/cancel`, "PUT", { reason })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  // Update customer schedule
  updateCustomerSchedule: async (customerScheduleId: string, note: string): Promise<ApiResponse> => {
    try {
      return await apiRequest<ApiResponse>(
        API_URLS.COMMAND,
        `/api/v1/customer-schedules/doctor/${customerScheduleId}`,
        "PATCH",
         note ,
      )
    } catch (error) {
      return Promise.reject(error)
    }
  },
}

// Hàm helper để lấy thông báo lỗi thân thiện với người dùng
export const getFriendlyErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    // Xử lý các trường hợp lỗi cụ thể
    if (error.status === 401) {
      return "Your session has expired. Please log in again."
    }

    if (error.detail === "Working Schedule Not Found !") {
      return "No appointments found for this date."
    }

    // Trả về thông báo lỗi từ API nếu có
    return error.detail || error.message || "An error occurred. Please try again."
  }

  // Lỗi mạng hoặc lỗi khác
  return "Network error. Please check your connection and try again."
}
// Kiểm tra xem một lỗi có phải là ApiError không
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === "object" && ("status" in error || "detail" in error)
}
