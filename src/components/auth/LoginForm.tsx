"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import { DEV_USER_EMAIL, DEV_USER_PASSWORD } from "@/adapters/driven/better-auth/dev-user";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const { error: signInError } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    setPending(false);
    if (signInError) {
      setError(signInError.message ?? "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
    router.push("/rooms");
    router.refresh();
  }

  async function handleDevLogin() {
    setError(null);
    setPending(true);

    const { error: signInError } = await authClient.signIn.email({
      email: DEV_USER_EMAIL,
      password: DEV_USER_PASSWORD,
    });

    setPending(false);
    if (signInError) {
      setError(signInError.message ?? "เข้าสู่ระบบไม่สำเร็จ (ลองรัน npm run db:seed ก่อน)");
      return;
    }
    router.push("/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-sm flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-muted text-sm">จองห้องประชุมได้หลังเข้าสู่ระบบ</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        อีเมล
        <input className="input" type="email" name="email" required autoComplete="email" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        รหัสผ่าน
        <input
          className="input"
          type="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      {process.env.NODE_ENV !== "production" && (
        <>
          <p className="text-muted text-sm text-center">— หรือ (เฉพาะ dev) —</p>
          <button
            className="btn-secondary"
            type="button"
            disabled={pending}
            onClick={handleDevLogin}
          >
            เข้าสู่ระบบด้วยบัญชีทดสอบ (Dev)
          </button>
        </>
      )}

      <p className="text-muted text-sm">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}
