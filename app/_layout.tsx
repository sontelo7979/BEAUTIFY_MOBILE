// app/_layout.tsx
"use client"

import { useEffect, useState } from "react"
import { Slot } from "expo-router"
import { AppointmentProvider } from "../context/AppointmentContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { View, Text } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken")
        setIsAuthenticated(!!token)
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Hiển thị màn hình loading khi đang kiểm tra xác thực
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  // Sử dụng Slot để render các màn hình
  return (
    <SafeAreaProvider>
      <AppointmentProvider>
        <Slot />
      </AppointmentProvider>
    </SafeAreaProvider>
  )
}