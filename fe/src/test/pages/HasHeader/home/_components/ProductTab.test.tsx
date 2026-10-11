import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductEntity } from "@/features/product/schema/product.schema";
import ProductTab from "@/pages/HasHeader/home/_components/ProductTab";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});

describe("ProductTab", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders real product cards and navigates to the product and collection", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    const products: ProductEntity[] = [
      {
        ProductID: 1,
        Name: "Keyboard A",
        ProductType: "KeyboardKit",
        Description: { blocks: [] },
        SubType: "75%",
        variants: [
          { colorText: "Black", image: "/black.jpg", price: 100000 },
          { colorText: "White", image: "/white.jpg", price: 125000 },
        ],
      },
      {
        ProductID: 2,
        Name: "Keyboard B",
        ProductType: "KeyboardKit",
        Description: { blocks: [] },
        SubType: "TKL",
        variants: [
          { colorText: "Black", image: "/black.jpg", price: 150000 },
          { colorText: "White", image: "/white.jpg", price: 145000 },
        ],
      },
    ];

    render(<ProductTab products={products} link="/collection/keycap" />);

    expect(screen.getByRole("img", { name: "Keyboard A" })).toHaveAttribute(
      "src",
      "/black.jpg",
    );
    expect(screen.getByRole("img", { name: "Keyboard B" })).toHaveAttribute(
      "src",
      "/black.jpg",
    );
    expect(screen.getByText("100.000 VND")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "View More" })[0]!);
    expect(navigate).toHaveBeenCalledWith("/product/1");

    await user.click(screen.getByRole("button", { name: "View All" }));
    expect(navigate).toHaveBeenCalledWith("/collection/keycap");
  });
});
