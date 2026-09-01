import { headers } from "next/headers";
import type { AuthService, AuthenticatedUser } from "@/core/ports/auth-service.port";
import { auth } from "./auth";

export class BetterAuthService implements AuthService {
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const rawRole = (session.user as { role?: string }).role;

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: rawRole === "admin" ? "admin" : "user",
    };
  }
}
