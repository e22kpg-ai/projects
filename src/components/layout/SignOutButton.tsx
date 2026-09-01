"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/adapters/driven/better-auth/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn-secondary" onClick={handleSignOut}>
      ออกจากระบบ
    </button>
  );
}
