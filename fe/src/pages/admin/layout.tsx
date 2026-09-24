"use client";
import { AdminSidebar } from "./_components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserIcon } from "lucide-react";
import { handleLogout } from "@/lib/handleLogout";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="w-full">
        <header className="h-14 flex items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-muted-foreground">Admin</h1>
          <div className="ml-auto">
            <button
              onClick={() => handleLogout()}
              className="flex items-center gap-2 rounded-2xl p-2 border-2 cursor-pointer "
            >
              <span>Log out</span>
              <UserIcon className="mr-2 h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
