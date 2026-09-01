export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
