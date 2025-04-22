// types/appointment.ts
export interface Appointment {
    id: string
    customerScheduleId: string
    customerName: string
    serviceName?: string
    treatmentType?: string
    startTime?: string
    endTime?: string
    time?: string
    stepIndex?: string
    procedurePriceTypeName?: string
    duration: string
    status: "Pending" | "Confirmed" | "Completed" | "Cancelled"
    phone?: string
    email?: string
    date?: string
    isNoted: boolean
  }