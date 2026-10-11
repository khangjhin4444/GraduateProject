import { fireEvent, render, screen } from "@testing-library/react";
import { useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RelevantProductCard } from "@/pages/HasHeader/product/_components/RelevantProductCard";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: vi.fn() };
});

describe("RelevantProductCard", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows product details and navigates to its detail page", () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    const product = {
      ProductID: 31,
      Name: "Artisan Keycap",
      Description: { blocks: [] },
      MainImage: "/keycap.jpg",
      Price: "120000",
    };

    render(<RelevantProductCard product={product} type="keycap" />);

    expect(screen.getByRole("img", { name: "Artisan Keycap" })).toHaveAttribute(
      "src",
      "/keycap.jpg",
    );
    expect(screen.getByText("120.000 VND")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View More" }));

    expect(navigate).toHaveBeenCalledWith("/product/31");
  });
});
