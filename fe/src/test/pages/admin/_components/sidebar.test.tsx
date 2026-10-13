import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/pages/admin/_components/sidebar";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("AdminSidebar Component", () => {
  afterEach(() => {
    cleanup();
  });
  const renderSidebar = (initialRoute = "/admin/dashboard") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <SidebarProvider>
          <AdminSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );
  };

  it("renders the brand logo and title correctly", () => {
    renderSidebar();

    const logo = screen.getByAltText("Logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/logo.png");

    const brandTitle = screen.getByText("JK Keyboard");
    expect(brandTitle).toBeInTheDocument();

    const brandLink = brandTitle.closest("a");
    expect(brandLink).toHaveAttribute("href", "/admin/dashboard");
  });

  it("renders the group label and all navigation items", () => {
    renderSidebar();

    expect(screen.getByText("Manage")).toBeInTheDocument();

    const expectedItems = [
      { title: "Dashboard", url: "/admin/dashboard" },
      { title: "Products", url: "/admin/products" },
      { title: "Orders", url: "/admin/orders" },
    ];

    expectedItems.forEach((item) => {
      const link = screen.getByRole("link", { name: item.title });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", item.url);
    });
  });

  it("marks the correct menu item as active based on current pathname", () => {
    renderSidebar("/admin/products");

    const dashboardBtn = screen
      .getByRole("link", { name: "Dashboard" })
      .closest("button");
    const productsBtn = screen
      .getByRole("link", { name: "Products" })
      .closest("button");
    const ordersBtn = screen
      .getByRole("link", { name: "Orders" })
      .closest("button");

    expect(productsBtn).toHaveAttribute("data-active");
    expect(dashboardBtn).not.toHaveAttribute("data-active");
    expect(ordersBtn).not.toHaveAttribute("data-active");
  });

  it("navigates and updates active state when clicking a menu link", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <SidebarProvider>
          <AdminSidebar />
          <Routes>
            <Route
              path="/admin/dashboard"
              element={<div>Dashboard Content</div>}
            />
            <Route
              path="/admin/orders"
              element={<div data-testid="orders-page">Orders Content</div>}
            />
          </Routes>
        </SidebarProvider>
      </MemoryRouter>,
    );

    const ordersLink = screen.getByRole("link", { name: "Orders" });
    await user.click(ordersLink);

    expect(screen.getByTestId("orders-page")).toBeInTheDocument();
    const ordersBtn = ordersLink.closest("button");
    expect(ordersBtn).toHaveAttribute("data-active");
  });
});
