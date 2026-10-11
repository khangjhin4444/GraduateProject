import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useProducts from "@/hooks/useProducts";
import KeyboardSection from "@/pages/HasHeader/home/_components/KeyboardSection";

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

describe("KeyboardSection", () => {
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

  it("loads both keyboard categories and switches between their tabs", async () => {
    const user = userEvent.setup();
    render(<KeyboardSection />);

    expect(productsHook).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: "KeyboardKit", page: 1, limit: 8 }),
    );
    expect(productsHook).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "Prebuild", page: 1, limit: 8 }),
    );
    expect(screen.getByTestId("product-tab")).toHaveTextContent(
      "/collection/keyboardkit",
    );

    await user.click(screen.getByRole("tab", { name: "Prebuild" }));
    expect(screen.getByTestId("product-tab")).toHaveTextContent(
      "/collection/prebuild",
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
            type === "KeyboardKit"
              ? new Error("Keyboard catalog unavailable")
              : new Error("Prebuild catalog unavailable"),
        }) as never,
    );

    render(<KeyboardSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Keyboard catalog unavailable",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Prebuild" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Prebuild catalog unavailable",
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

    render(<KeyboardSection />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Keyboard Kit products.",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Prebuild" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot load Prebuild products.",
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

    render(<KeyboardSection />);

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Prebuild" }));
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
    render(<KeyboardSection />);
    expect(
      screen.getByText("No Keyboard Kit products found."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Prebuild" }));
    expect(screen.getByText("No Prebuild products found.")).toBeInTheDocument();
  });
});
