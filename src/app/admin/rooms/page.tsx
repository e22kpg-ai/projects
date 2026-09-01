import { notFound, redirect } from "next/navigation";
import { getAllRoomsPlain } from "@/adapters/driving/queries/room.queries";
import { container } from "@/composition/container";
import { RoomsAdminSection } from "@/components/admin/RoomsAdminSection";
import { NavBar } from "@/components/layout/NavBar";

export default async function AdminRoomsPage() {
  const user = await container.authService.getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") notFound();

  const rooms = await getAllRoomsPlain();

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">
        <RoomsAdminSection rooms={rooms} />
      </main>
    </>
  );
}
