import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appointment } from '../types/appointment';

// Định nghĩa kiểu dữ liệu cho context
type AppointmentContextType = {
  appointments: Appointment[];
  updateAppointmentStatus: (id: string, status: 'Confirmed' | 'Pending' | 'Completed') => void;
};

// Sample appointment data
const sampleAppointments: Appointment[] = [
  {
    id: '1',
    customerName: 'Emma Johnson',
    phone: '(555) 123-4567',
    email: 'emma.j@example.com',
    date: '2025-04-06',
    time: '09:00 AM',
    treatmentType: 'Facial Treatment',
    duration: '60 minutes',
    status: 'Confirmed',
    notes: 'Customer has sensitive skin, use gentle products.'
  },
  {
    id: '2',
    customerName: 'Michael Chen',
    phone: '(555) 987-6543',
    email: 'michael.c@example.com',
    date: '2025-04-06',
    time: '11:30 AM',
    treatmentType: 'Laser Hair Removal',
    duration: '45 minutes',
    status: 'Pending',
    notes: 'First-time customer, consultation needed.'
  },
  {
    id: '3',
    customerName: 'Sophia Rodriguez',
    phone: '(555) 456-7890',
    email: 'sophia.r@example.com',
    date: '2025-04-06',
    time: '02:00 PM',
    treatmentType: 'Botox Injection',
    duration: '30 minutes',
    status: 'Confirmed',
    notes: 'Returning customer, follow-up treatment.'
  },
  {
    id: '4',
    customerName: 'James Wilson',
    phone: '(555) 789-0123',
    email: 'james.w@example.com',
    date: '2025-04-07',
    time: '10:00 AM',
    treatmentType: 'Chemical Peel',
    duration: '45 minutes',
    status: 'Confirmed',
    notes: ''
  },
  {
    id: '5',
    customerName: 'Olivia Kim',
    phone: '(555) 234-5678',
    email: 'olivia.k@example.com',
    date: '2025-04-07',
    time: '01:30 PM',
    treatmentType: 'Microdermabrasion',
    duration: '60 minutes',
    status: 'Pending',
    notes: 'Customer requested specific technician.'
  },
  {
    id: '6',
    customerName: 'Ethan Brown',
    phone: '(555) 345-6789',
    email: 'ethan.b@example.com',
    date: '2025-04-08',
    time: '11:00 AM',
    treatmentType: 'Dermal Fillers',
    duration: '45 minutes',
    status: 'Confirmed',
    notes: 'Allergic to lidocaine, use alternative.'
  }
];

// Create context with default value
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Provider component
type AppointmentProviderProps = {
  children: ReactNode;
};

export const AppointmentProvider = ({ children }: AppointmentProviderProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);

  // Add functions to update appointments as needed
  const updateAppointmentStatus = (id: string, status: 'Confirmed' | 'Pending' | 'Completed') => {
    setAppointments(appointments.map(appointment => 
      appointment.id === id ? { ...appointment, status } : appointment
    ));
  };

  return (
    <AppointmentContext.Provider value={{ 
      appointments, 
      updateAppointmentStatus 
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

// Custom hook to use the appointment context
export const useAppointments = (): AppointmentContextType => {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};