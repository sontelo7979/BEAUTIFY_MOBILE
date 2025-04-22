// utils/jwt-helper.ts
import type { JwtPayload, User } from "../types/user"

/**
 * Giải mã base64 URL-safe
 */
export function base64UrlDecode(input: string): string {
  // Thay thế các ký tự đặc biệt trong base64 URL-safe
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")

  // Thêm padding nếu cần
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)

  // Giải mã base64
  try {
    return decodeURIComponent(
      atob(base64 + padding)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
  } catch (e) {
    // Nếu có lỗi khi giải mã UTF-8, trả về chuỗi gốc
    return atob(base64 + padding)
  }
}

/**
 * Phân tích JWT và trả về payload
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format")
    }

    return JSON.parse(base64UrlDecode(parts[1]))
  } catch (e) {
    console.error("Error parsing JWT:", e)
    return null
  }
}

/**
 * Chuyển đổi JWT payload thành đối tượng User
 */
export function extractUserFromJwt(payload: JwtPayload): User {
  return {
    id: payload.UserId,
    name: payload.Name,
    email: payload.Email,
    role: payload.RoleName,
    profilePicture: payload.ProfilePicture,
    roleId: payload.RoleId,
  }
}