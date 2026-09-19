"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogout() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      } catch {
        // ignore — redirect regardless
      }
      router.replace("/auth/admin/login");
    };
    logout();
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-slate-500">
      Logging out…
    </div>
  );
}
