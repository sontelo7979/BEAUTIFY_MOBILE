// app/index.tsx
"use client"

import { useEffect, useState } from "react"
import { Redirect } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { View, Text, ActivityIndicator } from "react-native"

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4a6da7" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    )
  }

  // Chuyển hướng dựa trên trạng thái đăng nhập
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)" />
}