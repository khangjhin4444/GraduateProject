import { Outlet } from "react-router";
import Header from "@/components/Header/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/components/Footer";

export default function Layout() {
  return (
    <SidebarProvider className="flex-col relative">
      <Header></Header>
      <div className="flex-1 bg-background">
        <Outlet />
      </div>
      <div className="sticky bottom-0 left-0 right-0 -z-10">
        <Footer></Footer>
      </div>
    </SidebarProvider>
  );
}
