import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useProducts from "@/hooks/useProducts";
import SwitchKeycapSection from "@/pages/HasHeader/home/_components/SwitchKeycapSection";

vi.mock("@/hooks/useProducts", () => ({ default: vi.fn() }));
vi.mock("@/pages/HasHeader/home/_components/ProductTab", () => ({
  default: ({ link }: { link: string }) => (
    <div data-testid="product-tab">{link}</div>
  ),
}));

vi.mock("@/shared/components/ProductSkeleton", () => ({
  default: () => <div data-testid="skeleton">Loading</div>,
}));
const productsHook = vi.mocked(useProducts);

describe("SwitchKeycapSection", () => {
  beforeEach(() => {
    productsHook.mockReset();
    productsHook.mockImplementation(
      ({ type }) =>
        ({
          data: { pages: [{ data: [{ ProductID: 1, Name: type }] }] },
          isPending: false,
          isError: false,
          error: null,
        }) as never,
    );
  });

  afterEach(() => cleanup());

  it("loads both categories and switches between their tabs", async () => {
    const user = userEvent.setup();
    render(<SwitchKeycapSection />);

    expect(productsHook).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "Switch", page: 1, limit: 8 }),
    );
    expect(productsHook).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "Keycap", page: 1, limit: 8 }),
    );
    expect(screen.getByTestId("product-tab")).toHaveTextContent(
      "/collection/switch",
    );

    await user.click(screen.getByRole("tab", { name: "Keycap" }));
    expect(screen.getByTestId("product-tab")).toHaveTextContent(
      "/collection/keycap",
    );
  });

  it("shows the query error in the active category", () => {
    productsHook.mockImplementation(
      ({ type }) =>
        ({
          data: undefined,
          isPending: false,
          isError: true,
          error:
            type === "Switch"
              ? new Error("Switch catalog unavailable")
              : new Error("Keycap catalog unavailable"),
        }) as never,
    );

    render(<SwitchKeycapSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Switch catalog unavailable",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Keycap" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Keycap catalog unavailable",
    );
  });
  it("shows the default error in the active category", () => {
    productsHook.mockImplementation(
      () =>
        ({
          data: undefined,
          isPending: false,
          isError: true,
          error: "",
        }) as never,
    );

    render(<SwitchKeycapSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Switch products.",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Keycap" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Keycap products.",
    );
  });
  it("show the skeleton when pending", () => {
    productsHook.mockImplementation(
      () =>
        ({
          data: undefined,
          isPending: true,
          isError: false,
        }) as never,
    );

    render(<SwitchKeycapSection />);

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Keycap" }));
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });
  it("show empty message", () => {
    productsHook.mockImplementation(
      () =>
        ({
          data: { pages: [{ data: [] }] },
          isPending: false,
          isError: false,
        }) as never,
    );
    render(<SwitchKeycapSection />);
    expect(screen.getByText("No Switch products found.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Keycap" }));
    expect(screen.getByText("No Keycap products found.")).toBeInTheDocument();
  });
});
