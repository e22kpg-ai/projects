import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="flex-1 grid place-items-center p-6">
      <EmptyState
        className="max-w-md"
        title="ไม่พบหน้าที่ต้องการ"
        description="ลิงก์อาจหมดอายุ หรือห้องประชุมนี้ถูกลบออกจากระบบไปแล้ว"
        action={<Button href="/rooms">กลับไปหน้าห้องประชุม</Button>}
      />
    </main>
  );
}
