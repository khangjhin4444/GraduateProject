"use client";
import { LayoutDashboard, Package, ReceiptText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
const items = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ReceiptText },
];

export function AdminSidebar() {
  const pathname = useLocation().pathname;

  return (
    <Sidebar collapsible="icon" className="border-r shadow-sm">
      <SidebarHeader className="border-b pt-4 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent">
              <Link to="/admin/dashboard" className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full bg-gray-50 border p-1 shadow-sm shrink-0">
                  <img
                    className="object-contain rounded-full"
                    src="/logo.png"
                    alt="Logo"
                    width={28}
                    height={28}
                  />
                </div>
                <span className="truncate font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
                  JK Keyboard
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-2 mb-2 group-data-[collapsible=icon]:hidden">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    className="font-medium transition-all"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
