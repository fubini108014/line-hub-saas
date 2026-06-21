export interface MerchantProfile {
  id: string;
  email: string;
  companyName: string;
  address?: string;
  logoUrl?: string;
  hasLineCredentials: boolean;
}

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
  avatarUrl?: string;
  services: ServiceItem[];
}
