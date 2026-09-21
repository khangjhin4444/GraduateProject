import { Outlet } from "react-router";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout() {
  return (
    <SidebarProvider className="flex-col">
      <Header></Header>
      <Outlet />
    </SidebarProvider>
  );
}
