const BASE = import.meta.env.VITE_API_URL as string;

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface StaffMember {
  id: string;
  name: string;
  specialty?: string;
  staffServices: { service: ServiceItem }[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchServices(merchantId: string): Promise<ServiceItem[]> {
  return get(`/public/services?merchantId=${merchantId}`);
}

export async function fetchStaff(merchantId: string, serviceId: string): Promise<StaffMember[]> {
  return get(`/public/staff?merchantId=${merchantId}&serviceId=${serviceId}`);
}

export async function fetchSlots(
  merchantId: string,
  staffId: string,
  serviceId: string,
  date: string,
): Promise<TimeSlot[]> {
  const params = new URLSearchParams({ merchantId, staffId, serviceId, date });
  const data = await get<TimeSlot[]>(`/public/availability?${params}`);
  return data;
}

export interface Booking {
  id: string;
  serviceName: string;
  staffName: string;
  bookingDate: string;
  startTime: string;
  status: string;
  reviewId?: string;
}

export interface Coupon {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  expiresAt?: string;
  claimed: boolean;
  used: boolean;
  claimId?: string;
}

export async function fetchMyBookings(merchantId: string, lineUserId: string): Promise<Booking[]> {
  return get(`/public/my-bookings?merchantId=${merchantId}&lineUserId=${lineUserId}`);
}

export async function fetchCoupons(merchantId: string, lineUserId: string): Promise<Coupon[]> {
  return get(`/public/coupons?merchantId=${merchantId}&lineUserId=${lineUserId}`);
}

export async function createBooking(payload: {
  merchantId: string;
  lineUserId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}) {
  const res = await fetch(`${BASE}/public/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '預約失敗，請重試' }));
    throw new Error(err.message ?? '預約失敗');
  }
  return res.json();
}
