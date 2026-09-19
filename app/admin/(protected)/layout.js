import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import AdminShell from "./AdminShell";

/* ===============================
   ADMIN LAYOUT (SERVER PROTECTED)
   Every route inside app/admin/(protected)/ passes through here.
   Unlike the old layout, this ACTUALLY redirects unauthenticated
   or non-admin visitors — that check used to be commented out.
================================ */
export default async function ProtectedAdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
