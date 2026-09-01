"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import { DEV_USER_PASSWORD } from "@/adapters/driven/better-auth/dev-user";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const { error: signUpError } = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? "สมัครสมาชิกไม่สำเร็จ");
      return;
    }
    router.push("/rooms");
    router.refresh();
  }

  async function handleDevSignup() {
    setError(null);
    setPending(true);

    const suffix = Math.random().toString(36).slice(2, 8);
    const { error: signUpError } = await authClient.signUp.email({
      name: `Dev Tester ${suffix}`,
      email: `dev+${suffix}@example.local`,
      password: DEV_USER_PASSWORD,
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? "สมัครสมาชิกไม่สำเร็จ");
      return;
    }
    router.push("/rooms");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-sm flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">สมัครสมาชิก</h1>
        <p className="text-muted text-sm">สร้างบัญชีเพื่อเริ่มจองห้องประชุม</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        ชื่อ
        <input className="input" type="text" name="name" required autoComplete="name" />
      </label>

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
          minLength={8}
          autoComplete="new-password"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>

      {process.env.NODE_ENV !== "production" && (
        <>
          <p className="text-muted text-sm text-center">— หรือ (เฉพาะ dev) —</p>
          <button
            className="btn-secondary"
            type="button"
            disabled={pending}
            onClick={handleDevSignup}
          >
            สมัครบัญชีทดสอบใหม่ทันที (Dev)
          </button>
        </>
      )}

      <p className="text-muted text-sm">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
