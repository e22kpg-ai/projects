"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/*
 * error boundary ระดับ route — ต้องเป็น client component ตามข้อกำหนดของ Next
 * ก่อนหน้านี้ไม่มีไฟล์นี้ error ที่หลุดออกมาจึงไปโผล่หน้า default ของ Next แบบไม่มีทางออกให้ผู้ใช้
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 grid place-items-center p-6">
      <EmptyState
        className="max-w-md"
        title="เกิดข้อผิดพลาด"
        description="ระบบทำงานผิดพลาดชั่วคราว ลองใหม่อีกครั้ง ถ้ายังไม่หายให้แจ้งทีมดูแลระบบ"
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>ลองใหม่</Button>
            <Button href="/rooms" variant="secondary">
              กลับหน้าห้องประชุม
            </Button>
          </div>
        }
      />
    </main>
  );
}
