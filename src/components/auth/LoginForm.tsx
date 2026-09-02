"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import {
  getDevLoginCredentials,
  getDevAdminLoginCredentials,
} from "@/adapters/driving/actions/dev-auth.actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";

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

    /* ค่าคงที่อยู่ฝั่ง server เท่านั้น จึงไม่มีทางติดไปใน bundle ของ production */
    const { email, password } = await getDevLoginCredentials();
    const { error: signInError } = await authClient.signIn.email({ email, password });

    setPending(false);
    if (signInError) {
      setError(signInError.message ?? "เข้าสู่ระบบไม่สำเร็จ (ลองรัน npm run db:seed ก่อน)");
      return;
    }
    router.push("/rooms");
    router.refresh();
  }

  async function handleDevAdminLogin() {
    setError(null);
    setPending(true);

    const { email, password } = await getDevAdminLoginCredentials();
    const { error: signInError } = await authClient.signIn.email({ email, password });

    setPending(false);
    if (signInError) {
      setError(signInError.message ?? "เข้าสู่ระบบไม่สำเร็จ (ลองรัน npm run db:seed ก่อน)");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="text-muted text-sm">จองห้องประชุมได้หลังเข้าสู่ระบบ</p>
      </div>

      <Field label="อีเมล" required>
        <TextInput type="email" name="email" autoComplete="email" required />
      </Field>

      <Field label="รหัสผ่าน" required>
        <PasswordInput name="password" autoComplete="current-password" required />
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" loading={pending} fullWidth>
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>

      {process.env.NODE_ENV !== "production" && (
        <>
          <p className="text-muted text-sm text-center">— หรือ (เฉพาะ dev) —</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" disabled={pending} onClick={handleDevLogin} fullWidth>
              เข้าสู่ระบบ (ผู้ใช้ทั่วไป)
            </Button>
            <Button variant="secondary" disabled={pending} onClick={handleDevAdminLogin} fullWidth>
              เข้าสู่ระบบ (ผู้ดูแลระบบ)
            </Button>
          </div>
        </>
      )}

      <p className="text-muted text-sm">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="link">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}
