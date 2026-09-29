export type Role = "CUSTOMER" | "SALE" | "MANAGER" | "SHIPPER" | "ADMIN";

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
