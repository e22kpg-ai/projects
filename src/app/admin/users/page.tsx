import { requireAdmin } from "@/adapters/driving/queries/session.queries";
import { container } from "@/composition/container";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { UserRoleTable } from "@/components/admin/UserRoleTable";
import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/Button";

export default async function AdminUsersPage() {
  const user = await requireAdmin();

  const users = await container.listUsers({ actingUser: user });

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">จัดการสิทธิ์ผู้ใช้</h1>
          <Button href="/admin/rooms" variant="secondary">
            จัดการห้องประชุม
          </Button>
        </div>

        {/*
          ช่องทางรับคนที่ไม่มีอีเมล @rtarf.mi.th เข้าระบบ — อยู่คู่กับรายชื่อ
          เพราะเป็นงานเดียวกัน: ตัดสินว่าใครเข้าใช้ระบบได้บ้าง
        */}
        <CreateUserModal />

        <UserRoleTable users={users} currentUserId={user.id} />
      </main>
    </>
  );
}
