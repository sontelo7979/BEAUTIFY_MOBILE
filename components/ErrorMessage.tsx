// components/ErrorMessage.tsx
import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff8f8",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#d9534f",
    marginVertical: 10,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#d9534f",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#4a6da7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
})

export default ErrorMessage