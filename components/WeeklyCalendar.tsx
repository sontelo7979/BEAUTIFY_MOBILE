// components/WeeklyCalendar.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native"

interface WeeklyCalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  markedDates?: { [key: string]: boolean }
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, onDateSelect, markedDates = {} }) => {
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerMode, setPickerMode] = useState<"day" | "month" | "year">("month")
  const [tempDate, setTempDate] = useState(new Date(selectedDate))

  // Hàm lấy ngày đầu tuần (thứ 2)
  const getStartOfWeek = (date: Date): Date => {
    const day = date.getDay()
    // Nếu là chủ nhật (0), trừ 6 ngày để về thứ 2 tuần trước
    // Nếu không, trừ (day - 1) ngày để về thứ 2
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(date)
    monday.setDate(date.getDate() - diff)
    return monday
  }

  // Hàm lấy ngày cuối tuần (chủ nhật)
  const getEndOfWeek = (date: Date): Date => {
    const startOfWeek = getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return endOfWeek
  }

  // Hàm tạo mảng các ngày trong tuần
  const getDaysOfWeek = (date: Date): Date[] => {
    const startOfWeek = getStartOfWeek(date)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Hàm định dạng ngày thành chuỗi DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Hàm định dạng ngày thành chuỗi YYYY-MM-DD (để so sánh với markedDates)
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Hàm định dạng tháng/năm
  const formatMonthYear = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${year}`
  }

  // Hàm kiểm tra hai ngày có cùng ngày không
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  // Hàm lấy tên ngày trong tuần
  const getDayName = (date: Date): string => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    return days[date.getDay()]
  }

  // Hàm lấy tên tháng
  const getMonthName = (month: number): string => {
    const months = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ]
    return months[month]
  }

  // Cập nhật tuần hiện tại khi selectedDate thay đổi
  useEffect(() => {
    setCurrentWeek(getDaysOfWeek(selectedDate))
    setTempDate(new Date(selectedDate))
  }, [selectedDate])

  // Chuyển đến tuần trước
  const goToPreviousWeek = () => {
    if (currentWeek.length > 0) {
      const prevWeekDate = new Date(currentWeek[0])
      prevWeekDate.setDate(prevWeekDate.getDate() - 7)
      setCurrentWeek(getDaysOfWeek(prevWeekDate))
    }
  }

  // Chuyển đến tuần sau
  const goToNextWeek = () => {
    if (currentWeek.length > 0) {
      const nextWeekDate = new Date(currentWeek[0])
      nextWeekDate.setDate(nextWeekDate.getDate() + 7)
      setCurrentWeek(getDaysOfWeek(nextWeekDate))
    }
  }

  // Mở modal chọn ngày
  const openDatePicker = () => {
    setShowDatePicker(true)
    setPickerMode("month")
  }

  // Lấy số ngày trong tháng
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Lấy ngày đầu tiên của tháng
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay()
  }

  // Tạo mảng các ngày trong tháng để hiển thị trong lịch
  const generateCalendarDays = () => {
    const year = tempDate.getFullYear()
    const month = tempDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Điều chỉnh firstDay để thứ 2 là ngày đầu tuần (0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1

    const days = []

    // Thêm ngày từ tháng trước
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        day: daysInPrevMonth - adjustedFirstDay + i + 1,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      })
    }

    // Thêm ngày trong tháng hiện tại
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
      })
    }

    // Thêm ngày từ tháng sau
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const remainingDays = 42 - days.length // 6 hàng x 7 cột

    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
      })
    }

    return days
  }

  // Tạo mảng các tháng để hiển thị
  const generateMonths = () => {
    const months = []
    for (let i = 0; i < 12; i++) {
      months.push({
        month: i,
        year: tempDate.getFullYear(),
      })
    }
    return months
  }

  // Tạo mảng các năm để hiển thị
  const generateYears = () => {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }
    return years
  }

  // Xử lý khi chọn ngày
  const handleDaySelect = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day)
    setTempDate(newDate)
    setShowDatePicker(false)
    onDateSelect(newDate)
  }

  // Xử lý khi chọn tháng
  const handleMonthSelect = (month: number) => {
    const newDate = new Date(tempDate)
    newDate.setMonth(month)
    setTempDate(newDate)
    setPickerMode("day")
  }

  // Xử lý khi chọn năm
  const handleYearSelect = (year: number) => {
    const newDate = new Date(tempDate)
    newDate.setFullYear(year)
    setTempDate(newDate)
    setPickerMode("month")
  }

  // Render modal chọn ngày
  const renderDatePicker = () => {
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              {pickerMode === "day" && (
                <>
                  <TouchableOpacity onPress={() => setPickerMode("month")}>
                    <Text style={styles.modalTitle}>
                      {getMonthName(tempDate.getMonth())} {tempDate.getFullYear()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
              {pickerMode === "month" && (
                <>
                  <TouchableOpacity onPress={() => setPickerMode("year")}>
                    <Text style={styles.modalTitle}>{tempDate.getFullYear()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
              {pickerMode === "year" && (
                <>
                  <Text style={styles.modalTitle}>Chọn năm</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {pickerMode === "day" && (
              <View style={styles.calendarContainer}>
                <View style={styles.weekDaysHeader}>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, index) => (
                    <Text key={index} style={styles.weekDayText}>
                      {day}
                    </Text>
                  ))}
                </View>
                <View style={styles.calendarDays}>
                  {generateCalendarDays().map((item, index) => {
                    const isSelected =
                      item.day === tempDate.getDate() &&
                      item.month === tempDate.getMonth() &&
                      item.year === tempDate.getFullYear()

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          !item.isCurrentMonth && styles.otherMonthDay,
                          isSelected && styles.selectedCalendarDay,
                        ]}
                        onPress={() => handleDaySelect(item.day, item.month, item.year)}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            !item.isCurrentMonth && styles.otherMonthDayText,
                            isSelected && styles.selectedCalendarDayText,
                          ]}
                        >
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}

            {pickerMode === "month" && (
              <View style={styles.monthsContainer}>
                {generateMonths().map((item, index) => {
                  const isSelected = item.month === tempDate.getMonth()

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.monthItem, isSelected && styles.selectedMonthItem]}
                      onPress={() => handleMonthSelect(item.month)}
                    >
                      <Text style={[styles.monthItemText, isSelected && styles.selectedMonthItemText]}>
                        {getMonthName(item.month)}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {pickerMode === "year" && (
              <ScrollView style={styles.yearsContainer}>
                <View style={styles.yearsGrid}>
                  {generateYears().map((year, index) => {
                    const isSelected = year === tempDate.getFullYear()

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.yearItem, isSelected && styles.selectedYearItem]}
                        onPress={() => handleYearSelect(year)}
                      >
                        <Text style={[styles.yearItemText, isSelected && styles.selectedYearItemText]}>{year}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    )
  }

  if (currentWeek.length === 0) {
    return null
  }

  const startDate = currentWeek[0]
  const endDate = currentWeek[6]

  return (
    <View style={styles.container}>
      {/* Header hiển thị tuần hiện tại */}
      <View style={styles.weekHeader}>
        <Text style={styles.weekHeaderText}>
          Current week: {formatDate(startDate)} - {formatDate(endDate)}
        </Text>
      </View>

      {/* Thanh điều hướng tháng */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openDatePicker} style={styles.monthYearButton}>
          <Text style={styles.monthYearText}>{formatMonthYear(startDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Hiển thị tên các ngày trong tuần */}
      <View style={styles.daysContainer}>
        {currentWeek.map((day, index) => (
          <View key={index} style={styles.dayNameContainer}>
            <Text style={styles.dayNameText}>{getDayName(day)}</Text>
          </View>
        ))}
      </View>

      {/* Hiển thị các ngày trong tuần */}
      <View style={styles.datesContainer}>
        {currentWeek.map((day, index) => {
          const dateString = formatDateString(day)
          const isSelected = isSameDay(day, selectedDate)
          const isMarked = markedDates[dateString]

          return (
            <TouchableOpacity key={index} style={styles.dateContainer} onPress={() => onDateSelect(day)}>
              <View
                style={[
                  styles.dateCircle,
                  isSelected && styles.selectedDateCircle,
                  isMarked && !isSelected && styles.markedDateCircle,
                ]}
              >
                <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{day.getDate()}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Modal chọn ngày */}
      {renderDatePicker()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  weekHeader: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  weekHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976d2",
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 5,
  },
  navButtonText: {
    fontSize: 18,
    color: "#1976d2",
  },
  monthYearButton: {
    padding: 5,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1976d2",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  dayNameContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayNameText: {
    fontSize: 16,
    color: "#757575",
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 15,
  },
  dateContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
  },
  dateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDateCircle: {
    backgroundColor: "#1976d2",
  },
  markedDateCircle: {
    borderWidth: 1,
    borderColor: "#1976d2",
  },
  dateText: {
    fontSize: 18,
    color: "#212121",
  },
  selectedDateText: {
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1976d2",
  },
  closeButton: {
    fontSize: 18,
    color: "#757575",
    padding: 5,
  },
  calendarContainer: {
    marginBottom: 15,
  },
  weekDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
    width: 40,
    textAlign: "center",
  },
  calendarDays: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDay: {
    width: "14.28%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  calendarDayText: {
    fontSize: 14,
    color: "#212121",
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  otherMonthDayText: {
    color: "#9e9e9e",
  },
  selectedCalendarDay: {
    backgroundColor: "#1976d2",
    borderRadius: 20,
  },
  selectedCalendarDayText: {
    color: "white",
    fontWeight: "600",
  },
  monthsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#f5f5f5",
  },
  selectedMonthItem: {
    backgroundColor: "#1976d2",
  },
  monthItemText: {
    fontSize: 14,
    color: "#212121",
  },
  selectedMonthItemText: {
    color: "white",
    fontWeight: "600",
  },
  yearsContainer: {
    maxHeight: 300,
  },
  yearsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  yearItem: {
    width: "30%",
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#f5f5f5",
  },
  selectedYearItem: {
    backgroundColor: "#1976d2",
  },
  yearItemText: {
    fontSize: 14,
    color: "#212121",
  },
  selectedYearItemText: {
    color: "white",
    fontWeight: "600",
  },
})

export default WeeklyCalendar