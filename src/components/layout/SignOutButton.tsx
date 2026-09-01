"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={handleSignOut}>
      ออกจากระบบ
    </Button>
  );
}
