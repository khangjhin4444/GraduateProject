import { Outlet } from "react-router";
import Header from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/components/Footer";

export default function Layout() {
  return (
    <SidebarProvider className="flex-col">
      <Header></Header>
      <div className="flex-1">
        <Outlet />
      </div>

      <Footer></Footer>
    </SidebarProvider>
  );
}
