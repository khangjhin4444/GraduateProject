import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import useAdminOrders from "@/hooks/useOrderAdmin";
import DashboardPage from "@/pages/admin/dashboard";
import AdminLayout from "@/pages/admin/layout";
import AdminOrdersPage from "@/pages/admin/orders";
import AdminProductsPage from "@/pages/admin/products";
import { handleLogout } from "@/lib/handleLogout";

vi.mock("@/lib/handleLogout", () => ({ handleLogout: vi.fn() }));
vi.mock("@/hooks/useOrderAdmin", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useAdminOrderAction", () => ({ useAdminOrderAction: vi.fn() }));
vi.mock("@/pages/admin/products/_components/product-table", () => ({
  default: ({ type }: { type: string }) => (
    <div data-testid="products-table">{type}</div>
  ),
}));
vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    Outlet: () => <div data-testid="admin-outlet">Admin page content</div>,
  };
});
vi.mock("@/components/ui/sidebar", () => {
  const Container = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    SidebarProvider: Container,
    Sidebar: Container,
    SidebarContent: Container,
    SidebarGroup: Container,
    SidebarGroupContent: Container,
    SidebarHeader: Container,
    SidebarMenu: Container,
    SidebarMenuItem: Container,
    SidebarGroupLabel: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SidebarMenuButton: ({
      children,
      isActive,
    }: {
      children?: React.ReactNode;
      isActive?: boolean;
    }) => <div data-active={isActive}>{children}</div>,
    SidebarTrigger: () => <button type="button">Toggle sidebar</button>,
  };
});
vi.mock("recharts", () => {
  const Chart = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Bar: () => <div data-testid="chart-bar" />,
    BarChart: Chart,
    CartesianGrid: () => <div />,
    Line: () => <div data-testid="chart-line" />,
    LineChart: Chart,
    ResponsiveContainer: Chart,
    Tooltip: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Admin dashboard", () => {
  it("renders all summary metrics and both sales charts", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Revenue (MTD)")).toBeInTheDocument();
    expect(screen.getByText("$9,450")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("284")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("1,204")).toBeInTheDocument();
    expect(screen.getByText("Avg. Order")).toBeInTheDocument();
    expect(screen.getByText("$112.30")).toBeInTheDocument();
    expect(screen.getByText("Revenue trend")).toBeInTheDocument();
    expect(screen.getByText("Sales by category")).toBeInTheDocument();
    expect(screen.getByTestId("chart-line")).toBeInTheDocument();
    expect(screen.getByTestId("chart-bar")).toBeInTheDocument();
  });
});

describe("Admin orders page", () => {
  it("shows pending orders by default and switches to the selected status", async () => {
    const user = userEvent.setup();
    vi.mocked(useAdminOrders).mockReturnValue({
      data: { pages: [{ data: [] }] },
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isLoading: false,
      isFetchingNextPage: false,
    } as never);
    render(<AdminOrdersPage />);

    expect(
      screen.getByRole("heading", { name: "System Orders" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No order found in Pending state" }),
    ).toBeInTheDocument();

    for (const status of ["Confirmed", "Delivered", "Canceled"]) {
      await user.click(screen.getByRole("tab", { name: status }));
      expect(
        screen.getByRole("heading", {
          name: `No order found in ${status} state`,
        }),
      ).toBeInTheDocument();
    }
  });
});

describe("Admin products page", () => {
  it("renders a product table for every supported product type", () => {
    render(<AdminProductsPage />);

    expect(screen.getAllByTestId("products-table")).toHaveLength(4);
    expect(screen.getByText("KeyboardKit")).toBeInTheDocument();
    expect(screen.getByText("Prebuild")).toBeInTheDocument();
    expect(screen.getByText("Keycap")).toBeInTheDocument();
    expect(screen.getByText("Switch")).toBeInTheDocument();
  });
});

describe("Admin layout and sidebar integration", () => {
  it("renders the current route, navigation links, and logout action", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/products"]}>
        <AdminLayout />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("admin-outlet")).toHaveTextContent(
      "Admin page content",
    );
    expect(screen.getByRole("heading", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute(
      "src",
      "/logo.png",
    );
    expect(screen.getByRole("link", { name: "Logo JK Keyboard" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
    expect(screen.getByText("Manage")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Log out/ }));
    expect(handleLogout).toHaveBeenCalledOnce();
  });
});
