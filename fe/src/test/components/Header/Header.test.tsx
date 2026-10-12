import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import Header from "@/components/Header/Header";
import { useAppSelector } from "@/state/hooks";
import { useQuery } from "@tanstack/react-query";
import { handleLogout } from "@/lib/handleLogout";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("@/hooks/useCart", () => ({ cartQueryOptions: vi.fn() }));
vi.mock("@/state/hooks", () => ({ useAppSelector: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/lib/handleLogout", () => ({ handleLogout: vi.fn() }));

vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ toggleSidebar: vi.fn(), setOpenMobile: vi.fn() }),
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/shared/ProductSubtype", () => ({
  SUBTYPES: { keyboardkit: ["75"] },
}));

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
  it("navigates to the search page when submitting a keyword", async () => {
    const user = userEvent.setup();
    vi.mocked(useAppSelector).mockReturnValue(false); // Not authenticated
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText("Search items...");
    const searchBtn = screen.getByRole("button", { name: "search-btn" });

    // Typing and hitting enter
    await user.clear(searchInput);
    await user.click(searchBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
    await user.type(searchInput, "mechanical keyboard{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/search/mechanical%20keyboard");

    // Clicking the search button
    await user.clear(searchInput);
    await user.type(searchInput, "keycap");
    await user.click(searchBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/search/keycap");
  });

  it("renders login button and empty cart badge when unauthenticated", async () => {
    vi.mocked(useAppSelector).mockReturnValue(false); // isAuth = false
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const loginButton = screen
      .getByRole("button", { name: "" })
      .querySelector(".lucide-circle-user-round");
    expect(loginButton).toBeInTheDocument();
    await user.click(loginButton!);
    expect(mockNavigate).toHaveBeenCalledWith("/login");

    const cartBadge = screen.getByText("0");
    expect(cartBadge).toHaveClass("hidden");
  });

  it("renders user dropdown and active cart badge when authenticated", async () => {
    const user = userEvent.setup();
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 5 } } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const cartBadge = screen.getByText("5");
    expect(cartBadge).not.toHaveClass("hidden");
    expect(screen.getByTestId("profile-trigger")).toBeInTheDocument();
    await user.click(screen.getByTestId("profile-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("logout-menuitem")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("logout-menuitem"));
    expect(handleLogout).toHaveBeenCalledOnce();
  });

  it("handles cart quantity overflow (99+)", () => {
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 150 } } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
  it("navigate user to home page when click logo", async () => {
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 5 } } as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    await user.click(screen.getByAltText("Logo"));
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });
  it.each([
    {
      label: "cart-btn",
      route: "/cart",
    },
    {
      label: "order-btn",
      route: "/order",
    },
  ])(
    "navigate unauthenticate user to cart page when click cart",
    async ({ label, route }) => {
      vi.mocked(useAppSelector).mockReturnValue(true);
      vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 5 } } as any);
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      );
      await user.click(screen.getByLabelText(label));
      expect(mockNavigate).toHaveBeenCalledWith(route);
    },
  );
  it("navigates to the order page when clicking Orders inside the authenticated mobile profile dropdown", async () => {
    const user = userEvent.setup();
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 5 } } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("profile-trigger"));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /Orders/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: /Orders/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/order");
  });
  it("handles desktop products menu interactions (hover, toggle, and navigation)", async () => {
    const user = userEvent.setup();
    vi.mocked(useAppSelector).mockReturnValue(false);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const productsButton = screen.getAllByRole("button", {
      name: /Products/i,
    })[0];
    const wrapperDiv = productsButton.parentElement!;
    const productsMenu = wrapperDiv.querySelector("#products-menu")!;

    await user.click(productsButton);
    await user.click(productsButton);
    expect(productsMenu).toHaveClass("visible", "opacity-100");
    await user.click(productsButton);
    expect(productsMenu).toHaveClass("invisible", "opacity-0");

    await user.hover(wrapperDiv);
    expect(productsMenu).toHaveClass("visible");

    const categoryLink = screen.getByRole("link", { name: /Keyboard Kit/i });
    const categoryWrapper = categoryLink.parentElement!;

    await user.hover(categoryWrapper);

    const subTypeLink = screen.getByRole("link", { name: "75% or less" });
    expect(subTypeLink).toBeInTheDocument();

    await user.unhover(categoryWrapper);

    await user.hover(categoryWrapper);

    await user.click(subTypeLink);

    expect(productsMenu).toHaveClass("invisible", "opacity-0");

    await user.unhover(wrapperDiv);
  });
  it("display 0 in cart quantity if unauthenticate", () => {
    vi.mocked(useAppSelector).mockReturnValue(false);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("cart-btn")).toHaveTextContent(/0/);
  });
  it("display correct quantity if authenticate", () => {
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
    } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("cart-btn")).toHaveTextContent(/0/);
  });
  it("handles onClickCapture correctly when clicking inside the products menu", async () => {
    const user = userEvent.setup();
    vi.mocked(useAppSelector).mockReturnValue(false);
    vi.mocked(useQuery).mockReturnValue({ data: null } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const productsButton = screen.getAllByRole("button", {
      name: /Products/i,
    })[0];
    await user.click(productsButton);
    await user.click(productsButton);
    const productsMenu =
      productsButton.parentElement!.querySelector("#products-menu")!;

    expect(productsMenu).toHaveClass("visible");

    await user.click(productsMenu);

    expect(productsMenu).toHaveClass("visible");

    const categoryLink = screen.getByRole("link", { name: /Keyboard Kit/i });
    await user.hover(categoryLink.parentElement!);

    const subTypeLink = screen.getByRole("link", { name: "75% or less" });
    await user.click(subTypeLink);

    expect(productsMenu).toHaveClass("invisible", "opacity-0");
  });
  it("navigates to the service page", async () => {
    vi.mocked(useAppSelector).mockReturnValue(true);
    vi.mocked(useQuery).mockReturnValue({ data: { cartQuantity: 5 } } as any);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const serviceLinks = screen.getAllByRole("link", { name: "Service" });
    serviceLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/service");
    });
    const contactLink = screen.getAllByRole("link", { name: "Contact" });
    contactLink.forEach((link) => {
      expect(link).toHaveAttribute("href", "/contact");
    });
  });
});
