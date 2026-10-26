export type Role = "CUSTOMER" | "SALE" | "MANAGER" | "SHIPPER";

export interface UserSession {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  fullName?: string;
  company?: string;
  role: Role;
  avatarUrl?: string;
}
