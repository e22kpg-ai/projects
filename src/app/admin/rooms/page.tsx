import { getAllRoomsPlain } from "@/adapters/driving/queries/room.queries";
import { requireAdmin } from "@/adapters/driving/queries/session.queries";
import { RoomsAdminSection } from "@/components/admin/RoomsAdminSection";
import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/Button";

export default async function AdminRoomsPage() {
  await requireAdmin();

  const rooms = await getAllRoomsPlain();

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">จัดการห้องประชุม</h1>
          <div className="flex flex-wrap gap-2">
            <Button href="/admin/reports" variant="secondary">
              รายงานการใช้ห้อง
            </Button>
            <Button href="/admin/users" variant="secondary">
              จัดการสิทธิ์ผู้ใช้
            </Button>
          </div>
        </div>

        <RoomsAdminSection rooms={rooms} />
      </main>
    </>
  );
}
