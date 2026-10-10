import { cleanup, render, screen } from "@testing-library/react";
import { useLoaderData } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/pages/HasHeader/productByCategory";

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useLoaderData: vi.fn() };
});

vi.mock(
  "@/pages/HasHeader/productByCategory/_components/ProductSection",
  () => ({
    default: ({ type, sub }: { type: string; sub?: string }) => (
      <div data-testid="category-products">
        {type}:{sub ?? "all"}
      </div>
    ),
  }),
);

describe("Product category page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.mocked(useLoaderData).mockReturnValue({
      type: "keyboardkit",
      sub: "75%",
    });
  });

  it("passes category and optional subtype from route loader data", () => {
    render(<Page />);

    expect(screen.getByTestId("category-products")).toHaveTextContent(
      "keyboardkit:75%",
    );
  });

  it("supports a category without a subtype", () => {
    vi.mocked(useLoaderData).mockReturnValue({ type: "keycap" });
    render(<Page />);

    expect(screen.getByTestId("category-products")).toHaveTextContent(
      "keycap:all",
    );
  });
});
