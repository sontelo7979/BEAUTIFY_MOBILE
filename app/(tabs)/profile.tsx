import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal,
  TextInput,
  Alert, } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { queryService,authService, isApiError, getFriendlyErrorMessage } from "../../services/api"
import ErrorMessage from "../../components/ErrorMessage"
import { UserProfile } from "@/types/api-responses"
// @ts-ignore
import { useNavigation } from '@react-navigation/native';
// Add the ApiResponse interface



const Profile = () => {
const navigation = useNavigation()
const router = useNavigation()

// Change password state
const [changePasswordVisible, setChangePasswordVisible] = useState(false)
const [currentPassword, setCurrentPassword] = useState("")
const [newPassword, setNewPassword] = useState("")
const [confirmPassword, setConfirmPassword] = useState("")
const [changingPassword, setChangingPassword] = useState(false)

// Add a loading state and user profile state at the beginning of the component
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

// Add a useEffect to fetch user data when component mounts
useEffect(() => {
  fetchUserProfile()
}, [])

// Update the fetchUserProfile function to correctly access the user data from the value property
const fetchUserProfile = async () => {
  try {
    setLoading(true)
    setError(null)

    const response = await queryService.getUserInformation()

    if (response && response.isSuccess && response.value) {
      setUserProfile(response.value)
    } else {
      setError(response.error?.message || "Không thể tải thông tin người dùng")
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
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

 // Xử lý đổi mật khẩu
 const handleChangePassword = async () => {
  // Kiểm tra mật khẩu
  if (!currentPassword || !newPassword || !confirmPassword) {
    Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin")
    return
  }

  if (newPassword !== confirmPassword) {
    Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp")
    return
  }

  try {
    setChangingPassword(true)
    
    // Gọi API đổi mật khẩu (giả định API này tồn tại trong authService)
    const response = await authService.changePassword(newPassword)

    if (response && response.isSuccess) {
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công")
      // Đóng modal và reset form
      setChangePasswordVisible(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      Alert.alert("Lỗi", response.error?.message || "Không thể thay đổi mật khẩu")
    }
  } catch (error) {
    // console.error("Error changing password:", error)
    const errorMessage = getFriendlyErrorMessage(error)
    Alert.alert("Lỗi", errorMessage)

    if (isApiError(error) && error.status === 401) {
      AsyncStorage.removeItem("accessToken")
      router.replace("/(auth)")
    }
  } finally {
    setChangingPassword(false)
  }
}
const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem("accessToken")
    navigation.replace("(auth)")
  } catch (error) {
    console.error("Error during logout:", error)
  }
}

return (
  <SafeAreaView style={styles.container}>
    {/* Replace the hardcoded profile content in the return statement with dynamic content */}
    {/* Replace the ScrollView section with this: */}
    <ScrollView>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchUserProfile} />
      ) : userProfile ? (
        <>
          <View style={styles.header}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: userProfile.profilePicture || "https://placeholder.svg?height=120&width=120",
                }}
                style={styles.profileImage}
              />
            </View>
            <Text style={styles.name}>{userProfile.fullName}</Text>
            <Text style={styles.role}>Bác sĩ</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userProfile.email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{userProfile.phone || "Chưa cập nhật"}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không có dữ liệu</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => setChangePasswordVisible(true)}>
          <Text style={styles.actionButtonText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    {/* Modal đổi mật khẩu */}
    <Modal
      visible={changePasswordVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setChangePasswordVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Đổi mật khẩu</Text>

          <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!changingPassword}
          />

          <Text style={styles.inputLabel}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!changingPassword}
          />

          <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu mới"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!changingPassword}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setChangePasswordVisible(false)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
              }}
              disabled={changingPassword}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, changingPassword && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
)
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: "#f4f4f4",
},
header: {
  backgroundColor: "#fff",
  padding: 20,
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: "#ddd",
},
profileImageContainer: {
  width: 120,
  height: 120,
  borderRadius: 60,
  overflow: "hidden",
  marginBottom: 10,
},
profileImage: {
  width: "100%",
  height: "100%",
},
name: {
  fontSize: 22,
  fontWeight: "600",
  color: "#333",
  marginBottom: 5,
},
role: {
  fontSize: 16,
  color: "#777",
},
infoSection: {
  backgroundColor: "#fff",
  marginTop: 10,
  padding: 20,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: "500",
  color: "#333",
  marginBottom: 15,
},
infoItem: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},
infoLabel: {
  fontSize: 16,
  color: "#555",
},
infoValue: {
  fontSize: 16,
  color: "#333",
},
actionsSection: {
  marginTop: 20,
  paddingHorizontal: 20,
},
actionButton: {
  backgroundColor: "#4a6da7",
  padding: 15,
  borderRadius: 8,
  marginBottom: 10,
  alignItems: "center",
},
actionButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},
logoutButton: {
  backgroundColor: "#dc3545",
},
logoutButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},
// Add these styles to the StyleSheet
loadingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  minHeight: 300,
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
  minHeight: 300,
},
errorText: {
  fontSize: 16,
  color: "#dc3545",
  marginBottom: 15,
},
retryButton: {
  backgroundColor: "#4a6da7",
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 8,
},
retryButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},
// Add modal styles from profile-screen
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: "85%",
  backgroundColor: "white",
  borderRadius: 10,
  padding: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
modalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#4a6da7",
  marginBottom: 20,
  textAlign: "center",
},
inputLabel: {
  fontSize: 16,
  color: "#333",
  marginBottom: 8,
},
input: {
  backgroundColor: "#f5f5f5",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  fontSize: 16,
},
modalButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 10,
},
modalButton: {
  flex: 1,
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
},
cancelButton: {
  backgroundColor: "#f5f5f5",
  marginRight: 10,
},
cancelButtonText: {
  color: "#666",
  fontSize: 16,
  fontWeight: "600",
},
saveButton: {
  backgroundColor: "#4a6da7",
  marginLeft: 10,
},
saveButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "600",
},
disabledButton: {
  opacity: 0.7,
},
})

export default Profile