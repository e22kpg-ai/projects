"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/adapters/driven/better-auth/auth-client";
import { getDevSignupCredentials } from "@/adapters/driving/actions/dev-auth.actions";
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
      affiliation: String(formData.get("affiliation")).trim(),
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? "สมัครสมาชิกไม่สำเร็จ");
      return;
    }
    /*
     * ไป /pending ตรงๆ ไม่ใช่ /rooms — บัญชีใหม่เริ่มที่สถานะรออนุมัติเสมอ
     * ถ้าส่งไป /rooms มันจะถูกเด้งต่อมาที่ /pending อยู่ดี เสียรอบไปเปล่าๆ
     * และระหว่างเด้งผู้ใช้จะเห็นหน้าห้องประชุมแวบหนึ่ง ซึ่งชวนให้เข้าใจผิดว่าใช้ได้แล้ว
     */
    router.push("/pending?notice=signedup");
    router.refresh();
  }

  async function handleDevSignup() {
    setError(null);
    setPending(true);

    /* ค่าคงที่อยู่ฝั่ง server เท่านั้น จึงไม่มีทางติดไปใน bundle ของ production */
    const { email, password, name, affiliation } = await getDevSignupCredentials();
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      affiliation: affiliation ?? "",
    });

    setPending(false);
    if (signUpError) {
      setError(signUpError.message ?? "สมัครสมาชิกไม่สำเร็จ");
      return;
    }
    router.push("/pending?notice=signedup");
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

      {/*
        บอกโดเมนที่ใช้ได้ตั้งแต่ก่อนกรอก ไม่ใช่รอให้กด submit แล้วค่อยขึ้น error
        คนที่เผลอใช้อีเมลส่วนตัวจะได้รู้ทันที ไม่ต้องเสียเวลากรอกทั้งฟอร์มก่อนถูกปฏิเสธ
      */}
      <Field label="อีเมล" hint="ใช้ได้เฉพาะอีเมลของหน่วยงาน (@rtarf.mi.th)" required>
        <TextInput
          type="email"
          name="email"
          autoComplete="email"
          placeholder="ชื่อผู้ใช้@rtarf.mi.th"
          required
        />
      </Field>

      <Field label="สังกัด" hint="เช่น กรมยุทธการทหาร" required>
        <TextInput
          type="text"
          name="affiliation"
          autoComplete="organization"
          maxLength={120}
          required
        />
      </Field>

      {/* เดิม minLength={8} ไม่ถูกบอกผู้ใช้เลย จนกด submit แล้วเบราว์เซอร์ค่อยเตือน */}
      <Field label="รหัสผ่าน" hint="อย่างน้อย 8 ตัวอักษร" required>
        <PasswordInput name="password" autoComplete="new-password" minLength={8} required />
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" loading={pending} fullWidth>
        {pending ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>

      {/* บอกล่วงหน้าว่าสมัครเสร็จยังใช้ไม่ได้ทันที กัน expectation ผิดตั้งแต่ต้น */}
      <p className="text-xs text-muted text-center">
        หลังสมัครแล้วต้องรอผู้ดูแลระบบอนุมัติก่อนจึงจะเริ่มจองห้องประชุมได้
      </p>

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
