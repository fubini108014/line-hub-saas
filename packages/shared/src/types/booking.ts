export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingCreateDto {
  merchantId: string;
  lineUserId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export interface BookingSummary {
  id: string;
  serviceName: string;
  staffName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  status: BookingStatus;
}
