// types/api-responses.ts
import type { Appointment } from "./appointment"

// Interface chung cho API response
export interface ApiResponse {
  isSuccess: boolean
  isFailure: boolean
  error: {
    code: string
    message: string
  }
}

// Response cho API đăng nhập
export interface LoginResponse extends ApiResponse {
  value: {
    accessToken: string
    refreshToken: string
    refreshTokenExpiryTime: string
  }
}

// Response cho API lấy số lượng cuộc hẹn theo tháng
export interface MonthlyCountResponse extends ApiResponse {
  value: {
    year: number
    month: number
    appointmentCounts: {
      [date: string]: number
    }
  }
}

// Response cho API lấy danh sách cuộc hẹn theo ngày
export interface DailyCountResponse extends ApiResponse {
  value: Array<{
    date: string
    appointments: Appointment[]
  }>
}

// Response cho API lấy chi tiết cuộc hẹn
export interface AppointmentDetailsResponse extends ApiResponse {
  value: {
    appointment: Appointment
  }
}

// Interface cho API error
export interface ApiError {
  type?: string
  title?: string
  status: number
  detail?: string
  errors?: any
  message?: string
}



// Thêm vào file types/api-responses.ts
export interface UserInformationResponse extends ApiResponse {
    value: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      profilePicture: string | null;
    }
  }

 export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    profilePicture: string | null;
  }
  // Thêm vào file types/api-responses.ts
export interface ChangePasswordRequest {
    newPassword: string;
  }
  
  export interface ChangePasswordResponse extends ApiResponse {
    // Giả sử response chỉ trả về thông tin thành công/thất bại
    // mà không có dữ liệu cụ thể trong value
    value: any;
  }