import type { Role } from "@/core/ports/auth-service.port";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserRepository {
  findAll(): Promise<AppUser[]>;
  findById(id: string): Promise<AppUser | undefined>;
  updateRole(id: string, role: Role): Promise<AppUser | undefined>;
}
