export type Role = "user" | "admin";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
