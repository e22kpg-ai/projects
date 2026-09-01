"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import { DEV_USER_PASSWORD } from "@/adapters/driven/better-auth/dev-user";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";

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
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">สมัครสมาชิก</h1>
        <p className="text-muted text-sm">สร้างบัญชีเพื่อเริ่มจองห้องประชุม</p>
      </div>

      <Field label="ชื่อ" required>
        <TextInput type="text" name="name" autoComplete="name" required />
      </Field>

      <Field label="อีเมล" required>
        <TextInput type="email" name="email" autoComplete="email" required />
      </Field>

      {/* เดิม minLength={8} ไม่ถูกบอกผู้ใช้เลย จนกด submit แล้วเบราว์เซอร์ค่อยเตือน */}
      <Field label="รหัสผ่าน" hint="อย่างน้อย 8 ตัวอักษร" required>
        <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" loading={pending} fullWidth>
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>

      {process.env.NODE_ENV !== "production" && (
        <>
          <p className="text-muted text-sm text-center">— หรือ (เฉพาะ dev) —</p>
          <Button variant="secondary" disabled={pending} onClick={handleDevSignup} fullWidth>
            สมัครบัญชีทดสอบใหม่ทันที (Dev)
          </Button>
        </>
      )}

      <p className="text-muted text-sm">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="link">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
