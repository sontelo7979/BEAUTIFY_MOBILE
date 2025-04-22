// app/(auth)/index.tsx
"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authService, isApiError } from "../../services/api"

// Declare __DEV__ if it's not automatically available
declare const __DEV__: boolean

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    try {
      setLoading(true)

      const { token, user } = await authService.login(email, password)

      // Lưu thông tin người dùng
      await AsyncStorage.setItem("userData", JSON.stringify(user))
      await AsyncStorage.setItem("accessToken", token)

      // Chuyển đến màn hình Home
      router.replace("/(tabs)")
    } catch (error) {
      console.error("Login error:", error)

      // Hiển thị thông báo lỗi
      if (isApiError(error)) {
        if (error.status === 401) {
          Alert.alert("Login Failed", "Invalid email or password")
        } else {
          Alert.alert("Login Failed", error.message || "An error occurred during login")
        }
      } else {
        Alert.alert("Login Failed", "Network error. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Đăng nhập mẫu cho mục đích demo
  const handleDemoLogin = () => {
    setEmail("doctor@example.com")
    setPassword("password")

    // Giả lập đăng nhập thành công
    setTimeout(async () => {
      // Lưu token giả để kiểm tra xác thực
      await AsyncStorage.setItem("accessToken", "demo-token")

      // Lưu thông tin người dùng mẫu
      const demoUser = {
        id: "demo-id",
        name: "Dr. John Doe",
        email: "doctor@example.com",
        role: "Doctor",
        profilePicture: "https://placeholder.svg?height=100&width=100",
      }
      await AsyncStorage.setItem("userData", JSON.stringify(demoUser))

      router.replace("/(tabs)")
    }, 1000)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: "https://placeholder.svg?height=100&width=100" }} style={styles.logo} />
          <Text style={styles.title}>Beauty Clinic</Text>
          <Text style={styles.subtitle}>Doctor Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => Alert.alert("Reset Password", "Feature coming soon!")}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {typeof __DEV__ !== "undefined" && __DEV__ && (
            <TouchableOpacity
              style={[styles.demoButton, loading && styles.disabledButton]}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <Text style={styles.demoButtonText}>Demo Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a6da7",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#4a6da7",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#4a6da7",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  demoButton: {
    backgroundColor: "#6c757d",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
    height: 50,
  },
  demoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})